import {
    CONNECTED_PEERS_THRESHOLD,
    OUT_OF_SYNC_HEIGHT_THRESHOLD,
    SYNC_TIME_CHECK,
} from "app/constant.ts";
import { nodesAPI } from "app/services/api.ts";

type checkPayload = {
    nodeId: string;
};
type Message = {
    title: string;
    text: string;
};
export type CheckResult = {
    isFired: boolean;
    value: number | string;
};
export type Alert = {
    name: string;
    message: (userId: string, nodeId: string, nodeType: string) => {
        alertMessage: Message;
        resolveMessage: Message;
    };
    check(
        payload: checkPayload,
    ): Promise<{
        isFired: boolean;
        value: number | string;
    }>;
    // todo: should we pending for 5 minutes before sending the alert?
    // 1 cycle = ~5 minutes
    // forCycle: number;
};

async function highstsubjectiveHeadGauge() {
    if (highstsubjectiveHeadGauge.cache) {
        return highstsubjectiveHeadGauge.cache;
    }

    const result = await nodesAPI.promQuery.instantQuery(
        `max(hdr_sync_subjective_head_gauge{exported_job=~"celestia/.*"})`,
    );

    highstsubjectiveHeadGauge.cache = result.result[0].value.value ?? null;
    return result.result[0].value.value ?? null;
}

highstsubjectiveHeadGauge.cache = null as null | number;

const alerts = [
  {
      name: "LowPeersCount",
      message: (userId: string, nodeId: string, nodeType: string) => ({
          alertMessage: {
              title: "**Warning!** Low Peer Count Alert",
              text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has fewer than ${CONNECTED_PEERS_THRESHOLD} connected peers.`,
          },
          resolveMessage: {
              title: "**Resolved!** Low Peer Count Alert",
              text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** now has more than ${CONNECTED_PEERS_THRESHOLD} connected peers.`,
          },
      }),
    async check(payload: checkPayload) {
      const { nodeId } = payload;
      const connectedPeers = await nodesAPI.promQuery.instantQuery(
        `full_discovery_amount_of_peers{exported_instance="${nodeId}"}`,
      );
      const [data] = connectedPeers.result;
      return {
        isFired: !data || data.value.value < CONNECTED_PEERS_THRESHOLD,
        value: data ? data.value.value : 0,
      };
    },
  },
  {
      name: "StalledBlocks",
      message: (userId: string, nodeId: string, nodeType: string) => ({
          alertMessage: {
              title: "**Warning!** Stalled Blocks Alert",
              text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has stalled blocks.`,
          },
          resolveMessage: {
              title: "**Resolved!** Stalled Blocks Alert",
              text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has no stalled blocks now.`,
          },
      }),
    async check(payload: checkPayload) {
      const { nodeId } = payload;
      const hightChange = await nodesAPI.promQuery.instantQuery(
        `increase(hdr_sync_subjective_head_gauge{exported_instance="${nodeId}"}[${SYNC_TIME_CHECK}])`,
      );
      const [data] = hightChange.result;
      return {
        isFired: !data || data.value.value === 0,
        value: data ? data.value.value : 0,
      };
    },
  },
  {
      name: "OutOfSync",
      message: (userId: string, nodeId: string, nodeType: string) => ({
          alertMessage: {
              title: "**Warning!** Node Sync Alert",
              text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** is out of sync.`,
          },
          resolveMessage: {
              title: "**Resolved!** Node Sync Alert",
              text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** is synced now.`,
          },
      }),
    async check(payload: checkPayload) {
      const { nodeId } = payload;
      const highestSubjectiveHeadGaugeValue = await highstsubjectiveHeadGauge();
      const hightOfNodeResult = await nodesAPI.promQuery
        .instantQuery(
          `hdr_sync_subjective_head_gauge{exported_instance="${nodeId}"}`,
        );
      const [data] = hightOfNodeResult.result;
      return {
        isFired: !data ||
          highestSubjectiveHeadGaugeValue === null ||
          highestSubjectiveHeadGaugeValue - data.value.value >
            OUT_OF_SYNC_HEIGHT_THRESHOLD,
        value: data ? data.value.value : 0,
      };
    },
  },
  {
      name: "NoArchivalPeers",
      message: (userId: string, nodeId: string, nodeType: string) => ({
          alertMessage: {
              title: "**Warning!** No Archival Peers Alert",
              text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has no archival peers.`,
          },
          resolveMessage: {
              title: "**Resolved!** No Archival Peers Alert",
              text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** now has archival peers.`,
          },
      }),
    async check(payload: checkPayload) {
      const { nodeId } = payload;
      const connectedPeers = await nodesAPI.promQuery.instantQuery(
        `archival_discovery_amount_of_peers{exported_instance="${nodeId}"}`,
      );
      const [data] = connectedPeers.result;
      return {
        isFired: !data || data.value.value < 1,
        value: data ? data.value.value : 0,
      };
    },
  },
];

export default alerts as Alert[];

// const alertsMock = [
//     {
//         name: "LowPeersCount",
//         message: (userId: string, nodeId: string, nodeType: string) => ({
//             alertMessage: {
//                 title: "**Warning!** Low Peer Count Alert",
//                 text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has fewer than ${CONNECTED_PEERS_THRESHOLD} connected peers.`,
//             },
//             resolveMessage: {
//                 title: "**Resolved!** Low Peer Count Alert",
//                 text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** now has more than ${CONNECTED_PEERS_THRESHOLD} connected peers.`,
//             },
//         }),
//         async check(payload: checkPayload) {
//             return {
//                 isFired: false,
//                 value: 1,
//             };
//         },
//     },
//     {
//         name: "StalledBlocks",
//         message: (userId: string, nodeId: string, nodeType: string) => ({
//             alertMessage: {
//                 title: "**Warning!** Stalled Blocks Alert",
//                 text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has stalled blocks.`,
//             },
//             resolveMessage: {
//                 title: "**Resolved!** Stalled Blocks Alert",
//                 text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has no stalled blocks now.`,
//             },
//         }),
//         async check(payload: checkPayload) {
//             return {
//                 isFired: false,
//                 value: 1,
//             };
//         },
//     },
//     {
//         name: "OutOfSync",
//         message: (userId: string, nodeId: string, nodeType: string) => ({
//             alertMessage: {
//                 title: "**Warning!** Node Sync Alert",
//                 text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** is out of sync.`,
//             },
//             resolveMessage: {
//                 title: "**Resolved!** Node Sync Alert",
//                 text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** is synced now.`,
//             },
//         }),
//         async check(payload: checkPayload) {
//             return {
//                 isFired: false,
//                 value: 0,
//             };
//         },
//     },
//     {
//         name: "NoArchivalPeers",
//         message: (userId: string, nodeId: string, nodeType: string) => ({
//             alertMessage: {
//                 title: "**Warning!** No Archival Peers Alert",
//                 text: `**<@${userId}> take action! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** has no archival peers.`,
//             },
//             resolveMessage: {
//                 title: "**Resolved!** No Archival Peers Alert",
//                 text: `**<@${userId}> you can chillin' now! Your${" \`" + nodeType + "\` " || " "}node**\n\n**\`${nodeId}\`** now has archival peers.`,
//             },
//         }),
//         async check(payload: checkPayload) {
//             return {
//                 isFired: false,
//                 value: 0,
//             };
//         },
//     },
// ];
//
// export default alertsMock as Alert[];