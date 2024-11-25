import { kv } from "app/services/storage.ts";
import { bridgeNodesAPI } from "app/services/api.ts";
import { disApi, isRecent } from "app/utils.ts";
import { EmbedBuilder } from "discord.js";
import alerts, { Alert, CheckResult } from "app/alerts.ts";
import { isObject } from "app/utils.ts";
// TODO: create resolve and alert messages
const createAlertMessage = (title: string, text: string) =>
  new EmbedBuilder().setTitle(title)
    .setDescription(text)
    .setColor(0xf3cd37)
    .setThumbnail(
      "https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/bridge_metrics_checker.png",
    )
    .setFooter({ text: "Made by www.dteam.tech \uD83D\uDFE0" })
    .setTimestamp(new Date());
// TODO: Create global error handler and send error message to private channel
Deno.cron("Check bridge nodes", "*/5 * * * *", async () => {
  const nodesIds = await bridgeNodesAPI.getAllBridgeNodesIds();
  const nodesChecks = new Map<string, {
    check: CheckResult;
    alert: Alert;
  }[]>();

  // colllect alerts
  for (const nodeId of nodesIds) {
    const checks = [];
    for (const alert of alerts) {
      const checkResult = await alert.check({ nodeId });
      console.log("checkResult", checkResult);
      checks.push({ check: checkResult, alert });
    }
    nodesChecks.set(nodeId, checks);
  }

  const subs = kv.list({
    prefix: ["subscription"],
  });

  for await (const { key, value } of subs) {
    const [_, userId, nodeId] = key;
    console.log("subs", value);
    if (!isObject(value)) continue;

    const nodeData = nodesChecks.get(String(nodeId));
    if (!nodeData) continue;

    const alerted: Record<string, string> =
      isObject(value) && "alerted" in value
        ? value.alerted as Record<string, string>
        : {};

    const newAlerted: Record<string, string> = {};

    for (const alert of nodeData) {
      const isFired = alert.check.isFired;
      const message = alert.alert.message(String(userId), String(nodeId));
      const embededAlertMessage = isFired
        ? createAlertMessage(
          message.alertMessage.title,
          message.alertMessage.text,
        )
        : createAlertMessage(
          message.resolveMessage.title,
          message.resolveMessage.text,
        );

      if (isFired) {
        const alertedTimeIso = alerted[alert.alert.name];
        if (alertedTimeIso && isRecent(alertedTimeIso)) {
          newAlerted[alert.alert.name] = alertedTimeIso;
          continue;
        }
        await disApi.sendEmbedMessageBotChannel(embededAlertMessage);
        newAlerted[alert.alert.name] = new Date().toISOString();
      } else if (alert.alert.name in alerted) {
        await disApi.sendEmbedMessageBotChannel(embededAlertMessage);
        delete alerted[alert.alert.name];
      }
    }

    await kv.set(["subscription", userId, nodeId], {
      userId,
      nodeBridgeId: nodeId,
      subscribedAt: "subscribedAt" in value
        ? value.subscribedAt
        : new Date().toISOString(),
      alerted: newAlerted,
    });
  }
});
