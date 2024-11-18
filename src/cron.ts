import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
import { disApi } from "app/utils.ts";
import { EmbedBuilder } from "discord.js";

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
    if (!nodeData) continue;

    const { connectedPeers, syncStatus } = nodeData;
    const grabLastSyncStatus = syncStatus.reverse().slice(-LAST_SYNC_THRESHOLD);
    const sumSync = grabLastSyncStatus.reduce(
        (acc: number, curr: { value: number }) => acc + curr.value,
        0,
    );

    if (sumSync >= LAST_SYNC_THRESHOLD) {
      const embed = new EmbedBuilder()
          .setTitle("Warning! Node sync alert")
          .setDescription(`<@${String(userId)}>, node **\`${String(nodeId)}\`** is out of sync`)
          .setColor(0xf3cd37)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())

      disApi.sendEmbedMessageBotChannel(embed);
    }

    if (connectedPeers.value.value < CONNECTED_PEERS_THRESHOLD && sumSync < LAST_SYNC_THRESHOLD) {
      const embed = new EmbedBuilder()
          .setTitle("Warning! Low peer count alert")
          .setDescription(`<@${String(userId)}>, node **\`${String(nodeId)}\`** has less than ${CONNECTED_PEERS_THRESHOLD} connected peers`)
          .setColor(0xf3cd37)
          .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png")
          .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
          .setTimestamp(new Date())

      disApi.sendEmbedMessageBotChannel(embed);
    }
  }
});