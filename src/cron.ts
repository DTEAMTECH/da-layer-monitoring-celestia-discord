import { kv } from "app/services/storage.ts";
import { nodesAPI } from "app/services/api.ts";
import { disApi, isRecent } from "app/utils.ts";
import { EmbedBuilder } from "discord.js";
import alerts, { Alert, CheckResult } from "app/alerts.ts";
import { isObject } from "app/utils.ts";

const createAlertMessage = (title: string, text: string) =>
    new EmbedBuilder()
        .setTitle(title)
        .setDescription(text)
        .setColor(title.indexOf("Warning") !== -1 ? 0xaf3838 : 0x32b76c)
        .setThumbnail("https://raw.githubusercontent.com/DTEAMTECH/contributions/refs/heads/main/celestia/utils/da_layer_metrics.png")
        .setFooter({ text: "Powered by www.dteam.tech \uD83D\uDFE0" })
        .setTimestamp(new Date());

async function runCron() {
  try {
    const nodesIds = await nodesAPI.getAllNodesIds();
    const nodesChecks = new Map<string, { check: CheckResult; alert: Alert }[]>();
    for (const nodeId of nodesIds) {
      const checks = [];
      for (const alert of alerts) {
        try {
          const checkResult = await alert.check({ nodeId });
          console.log("checkResult", checkResult);
          checks.push({ check: checkResult, alert });
        } catch (checkError) {
          console.error(`Error checking node ${nodeId} for alert ${alert.alert.name}:`, checkError);
        }
      }
      nodesChecks.set(nodeId, checks);
    }
    const subs = kv.list({ prefix: ["subscription"] });
    for await (const { key, value } of subs) {
      const [_, userId, nodeId] = key;
      console.log("subs", value);
      if (!isObject(value)) continue;
      const nodeData = nodesChecks.get(String(nodeId));
      if (!nodeData) continue;
      const alerted: Record<string, string> = isObject(value) && "alerted" in value ? (value.alerted as Record<string, string>) : {};
      const newAlerted: Record<string, string> = {};
      const nodeType = await nodesAPI.getNodeType(nodeId);
      for (const alert of nodeData) {
        const isFired = alert.check.isFired;
        const message = alert.alert.message(String(userId), String(nodeId), String(nodeType));
        const embeddedAlertMessage = isFired
            ? createAlertMessage(message.alertMessage.title, message.alertMessage.text)
            : createAlertMessage(message.resolveMessage.title, message.resolveMessage.text);
        if (isFired) {
          const alertedTimeIso = alerted[alert.alert.name];
          if (alertedTimeIso && isRecent(alertedTimeIso)) {
            newAlerted[alert.alert.name] = alertedTimeIso;
            continue;
          }
          try {
            await disApi.sendEmbedMessageUser(String(userId), embeddedAlertMessage);
          } catch (sendError) {
            console.error(`Error sending alert to user ${userId} for node ${nodeId} (${alert.alert.name}):`, sendError);
          }
          newAlerted[alert.alert.name] = new Date().toISOString();
        } else if (alert.alert.name in alerted) {
          try {
            await disApi.sendEmbedMessageUser(String(userId), embeddedAlertMessage);
          } catch (sendError) {
            console.error(`Error sending resolve alert to user ${userId} for node ${nodeId} (${alert.alert.name}):`, sendError);
          }
          delete alerted[alert.alert.name];
        }
      }
      await kv.set(["subscription", userId, nodeId], {
        userId,
        nodeId: nodeId,
        subscribedAt: "subscribedAt" in value ? value.subscribedAt : new Date().toISOString(),
        alerted: newAlerted,
      });
    }
  } catch (error) {
    console.error("Error in runCron:", error);

    Deno.exit(1);
  }
}

await runCron();