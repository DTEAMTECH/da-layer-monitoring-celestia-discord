import { InstantVector, PrometheusDriver, SampleValue } from "prometheus-query";
import config from "app/config.ts";

class BridgeNodesAPI {
  private promQuery: PrometheusDriver;
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
      "service_instance_id",
      undefined,
      date,
      new Date(),
    );
    return data;
  }
  public async buildInfo(nodeId: string): Promise<InstantVector | null> {
    const data = await this.promQuery.instantQuery(
      `celestia_build_info{service_instance_id="${nodeId}"}`,
    );
    const [result] = data.result;
    if (!result) {
      return null;
    }
    return result;
  }
  public async syncStatus(
    nodeId: string,
    lastMinutes: number = 10,
  ): Promise<Array<SampleValue> | null> {
    const date = new Date();
    date.setMinutes(date.getMinutes() - lastMinutes);
    const data = await this.promQuery.rangeQuery(
      `celestia_hdr_sync_loop_status_gauge{service_instance_id="${nodeId}"}`,
      date,
      new Date(),
      "1m",
    );
    const [result] = data.result;
    if (!result) {
      return null;
    }
    return result.values;
  }
  public async connectedPeers(nodeId: string): Promise<InstantVector | null> {
    const data = await this.promQuery.instantQuery(
      `celestia_full_discovery_handler_peer_result_total{service_instance_id="${nodeId}", result="connected"}`,
    );
    const [result] = data.result;
    if (!result) {
      return null;
    }
    return result;
  }
}

export const bridgeNodesAPI = new BridgeNodesAPI(config.PROMETHUES_URL);
