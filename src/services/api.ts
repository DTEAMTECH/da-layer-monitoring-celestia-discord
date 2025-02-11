import { InstantVector, PrometheusDriver } from "prometheus-query";
import config from "app/config.ts";

class NodesAPI {
  public promQuery: PrometheusDriver;

  constructor(public promURL: string) {
    this.promURL = promURL;
    this.promQuery = new PrometheusDriver({
      endpoint: this.promURL,
      baseURL: "/api/v1",
    });
  }

  public async getAllNodesIds(): Promise<string[]> {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const data = await this.promQuery.labelValues(
        "exported_instance",
        undefined,
        date,
        new Date()
    );
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    return data.filter((nodeId) => !ipRegex.test(nodeId));
  }

  public async buildInfo(nodeId: string): Promise<InstantVector | null> {
    const data = await this.promQuery.instantQuery(
        `build_info{exported_instance="${nodeId}"}`
    );
    if (!data.result || data.result.length === 0) {
      return null;
    }
    return data.result[0];
  }

  public async getNodeType(nodeId: string): Promise<string | null> {
    try {
      const data = await this.promQuery.instantQuery(
          `build_info{exported_instance="${nodeId}"}`
      );
      if (!data.result || data.result.length === 0) {
        return null;
      }

      for (const result of data.result) {
        const jobLabel: string | undefined = result.metric.labels.exported_job;

        if (jobLabel && jobLabel.startsWith("celestia/")) {
          const parts = jobLabel.split("/");
          if (parts.length >= 2) {
            return parts[1];
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error while getting type of node ${nodeId}:`, error);
      return null;
    }
  }
}

export const nodesAPI = new NodesAPI(config.PROMETHEUS_URL);