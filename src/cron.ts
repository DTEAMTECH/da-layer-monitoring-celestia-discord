import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
import { disApi } from "app/utils.ts";
Deno.cron("Check bridge nodes", "*/5 * * * *", async () => {
  const CONNECTED_PEERS_THRESHOLD = 5;
  const LAST_SYNC_THRESHOLD = 5;
  const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
  const nodeCache = new Map();
  for (const nodeId of nodesIds) {
    const buildInfo = await bridgeNodesAPI.buildInfo(nodeId);
    const connectedPeers = await bridgeNodesAPI.connectedPeers(nodeId);
    const syncStatus = await bridgeNodesAPI.syncStatus(nodeId);
    nodeCache.set(nodeId, { buildInfo, connectedPeers, syncStatus });
  }
  const subs = kv.list({
    prefix: ["subscription"],
  });

  for await (const { key, value: _value } of subs) {
    const [_, userId, nodeId] = key;
    const nodeData = nodeCache.get(nodeId);
    if (!nodeData) {
      continue;
    }
    const { connectedPeers, syncStatus } = nodeData;
    const grabLastSyncStatus = syncStatus.reverse().slice(-LAST_SYNC_THRESHOLD);
    const sumSync = grabLastSyncStatus.reduce(
      (acc: number, curr: { value: number }) => acc + curr.value,
      0,
    );
    if (sumSync >= LAST_SYNC_THRESHOLD) {
      disApi.sendMessageBotChannel(
        `Hey <@${String(userId)}>\n seems node \`${
          String(nodeId)
        }\` is not syncing, please pay attention`,
      );
    }
    if (connectedPeers.value.value < CONNECTED_PEERS_THRESHOLD) {
      disApi.sendMessageBotChannel(
        `Hey <@${String(userId)}>\nNode: \`${
          String(nodeId)
        }\` has less than ${CONNECTED_PEERS_THRESHOLD} connected peers`,
      );
    }
  }
});
