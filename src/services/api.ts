import { InstantVector, PrometheusDriver, SampleValue } from "prometheus-query";
import config from "app/config.ts";

class BridgeNodesAPI {
  public promQuery: PrometheusDriver;
  constructor(public promURL: string) {
    this.promURL = promURL;
    this.promQuery = new PrometheusDriver({
      endpoint: this.promURL,
      baseURL: "/api/v1",
    });
  }
  public async getAllBridgeNodesIds() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const data = await this.promQuery.labelValues(
      "exported_instance",
      undefined,
      date,
      new Date(),
    );
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    return data.filter((nodeId) => !ipRegex.test(nodeId)); 
  }
  public async buildInfo(nodeId: string): Promise<InstantVector | null> {
    const data = await this.promQuery.instantQuery(
      `build_info{exported_instance="${nodeId}", exported_job="celestia/Bridge" }`,
    );
    const [result] = data.result;
    if (!result) {
      return null;
    }
    return result;
  }
}
export const bridgeNodesAPI = new BridgeNodesAPI(config.PROMETHUES_URL);
