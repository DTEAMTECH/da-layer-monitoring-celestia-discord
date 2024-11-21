import { CONNECTED_PEERS_THRESHOLD, SYNC_TIME_CHECK, OUT_OF_SYNC_HEIGHT_THRESHOLD } from "app/constant.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
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
    message: (userId: string, nodeId: string) => {  
        alertMessage: Message;
        resolveMessage: Message;
    };
    check(
        payload: checkPayload,
    ): Promise<
        {
            isFired: boolean;
            value: number | string;
        }
    >;
    // todo: should we pending for 5 minutes before sending the alert?
    // 1 cycle = ~5 minutes
    // forCycle: number;
};

async function highstsubjectiveHeadGauge() {
    if (highstsubjectiveHeadGauge.cache) {
        return highstsubjectiveHeadGauge.cache;
    }

    const result = await bridgeNodesAPI.promQuery.instantQuery(
        'max(hdr_sync_subjective_head_gauge{exported_job="celestia/Bridge"})',
    );

    highstsubjectiveHeadGauge.cache = result.result[0].value.value ?? null;
    return result.result[0].value.value ?? null;
}

highstsubjectiveHeadGauge.cache = null as null | number;
const alerts = [
    {
        name: "TooFewPeers",
        message: (userId: string, nodeId: string) => ({
            alertMessage: {
                title: "Warning! Low peer count alert",
                text:
                    `<@${userId}>, node **\`${nodeId}\`** has less than ${CONNECTED_PEERS_THRESHOLD} connected peers`,
            },
            resolveMessage: {
                title: "Low peer count alert resolved",
                text:
                    `<@${userId}>, node **\`${nodeId}\`** has more than ${CONNECTED_PEERS_THRESHOLD} connected peers`,
            },
        }),
        async check(payload: checkPayload) {
            const { nodeId } = payload;
            const connectedPeers = await bridgeNodesAPI.promQuery.instantQuery(
                `full_discovery_amount_of_peers{exported_instance="${nodeId}", exported_job="celestia/Bridge"}`,
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
        message: (userId: string, nodeId: string) => ({
            alertMessage: {
                title: "Warning! Stalled blocks alert",
                text: `<@${userId}>, node **\`${nodeId}\`** has stalled blocks`,
            },
            resolveMessage: {
                title: "Stalled blocks alert resolved",
                text:
                    `<@${userId}>, node **\`${nodeId}\`** has no stalled blocks`,
            },
        }),
        async check(payload: checkPayload) {
            const { nodeId } = payload;
            const hightChange = await bridgeNodesAPI.promQuery.instantQuery(
                `increase(hdr_sync_subjective_head_gauge{exported_instance="${nodeId}", exported_job="celestia/Bridge"}[${SYNC_TIME_CHECK}])`,
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
        message: (userId: string, nodeId: string) => ({
            alertMessage: {
                title: "Warning! Node sync alert",
                text: `<@${userId}>, node **\`${nodeId}\`** is out of sync`,
            },
            resolveMessage: {
                title: "Node sync alert resolved",
                text: `<@${userId}>, node **\`${nodeId}\`** is in sync`,
            },
        }),
        async check(payload: checkPayload) {
            const { nodeId } = payload;
            const highestSubjectiveHeadGaugeValue =
                await highstsubjectiveHeadGauge();
            const hightOfNodeResult = await bridgeNodesAPI.promQuery
                .instantQuery(
                    `hdr_sync_subjective_head_gauge{exported_job="celestia/Bridge", exported_instance="${nodeId}"}`,
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
        message: (userId: string, nodeId: string) => ({
            alertMessage: {
                title: "Warning! No archival peers alert",
                text:
                    `<@${userId}>, node **\`${nodeId}\`** has no archival peers`,
            },
            resolveMessage: {
                title: "No archival peers alert resolved",
                text: `<@${userId}>, node **\`${nodeId}\`** has archival peers`,
            },
        }),
        async check(payload: checkPayload) {
            const { nodeId } = payload;
            const connectedPeers = await bridgeNodesAPI.promQuery.instantQuery(
                `archival_discovery_amount_of_peers{exported_instance="${nodeId}", exported_job="celestia/Bridge"}`,
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
//         name: "TooFewPeers",
//         message: (userId: string, nodeId: string) => ({
//             alertMessage: {
//                 title: "Warning! Low peer count alert",
//                 text:
//                     `<@${userId}>, node **\`${nodeId}\`** has less than ${CONNECTED_PEERS_THRESHOLD} connected peers`,
//             },
//             resolveMessage: {
//                 title: "Low peer count alert resolved",
//                 text:
//                     `<@${userId}>, node **\`${nodeId}\`** has more than ${CONNECTED_PEERS_THRESHOLD} connected peers`,
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
//         message: (userId: string, nodeId: string) => ({
//             alertMessage: {
//                 title: "Warning! Stalled blocks alert",
//                 text: `<@${userId}>, node **\`${nodeId}\`** has stalled blocks`,
//             },
//             resolveMessage: {
//                 title: "Stalled blocks alert resolved",
//                 text:
//                     `<@${userId}>, node **\`${nodeId}\`** has no stalled blocks`,
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
//         message: (userId: string, nodeId: string) => ({
//             alertMessage: {
//                 title: "Warning! Node sync alert",
//                 text: `<@${userId}>, node **\`${nodeId}\`** is out of sync`,
//             },
//             resolveMessage: {
//                 title: "Node sync alert resolved",
//                 text: `<@${userId}>, node **\`${nodeId}\`** is in sync`,
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
//         message: (userId: string, nodeId: string) => ({
//             alertMessage: {
//                 title: "Warning! No archival peers alert",
//                 text:
//                     `<@${userId}>, node **\`${nodeId}\`** has no archival peers`,
//             },
//             resolveMessage: {
//                 title: "No archival peers alert resolved",
//                 text: `<@${userId}>, node **\`${nodeId}\`** has archival peers`,
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
// export default alertsMock as Alert[];
