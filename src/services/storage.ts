/// <reference lib="deno.unstable" />
import config from "app/config.ts";
let kv: Deno.Kv;
if (config.KV_PATH) {
  kv = await Deno.openKv(config.KV_PATH);
} else {
  kv = await Deno.openKv();
}
export { kv };
