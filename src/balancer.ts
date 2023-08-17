import cron from "node-cron";
import { Config, defaultConfig } from "./types/config";
import { request } from "./types/request";
import { RPC, defaultRPC } from "./types/rpc";

export class Balancer {
  public rpcs: RPC[] = [];
  public currentRPC: RPC = defaultRPC("");
  public cronTask: cron.ScheduledTask | undefined = undefined;
  public config: Config = defaultConfig();

  constructor(rpcs: RPC[], cache?: Config) {
    this.rpcs = rpcs;
    this.config = cache ?? defaultConfig();
  }

  nextRPC(): RPC {
    let notDownRpcs = this.rpcs.filter((rpc) => !rpc.isDown);

    let sortedRpcs = notDownRpcs.sort(
      (a, b) => a.averageResponseTime - b.averageResponseTime
    );

    if (sortedRpcs.length > 0) {
      this.currentRPC = sortedRpcs[0];
    } else {
      this.currentRPC = this.rpcs[0];
    }

    return this.currentRPC;
  }

  checkRPCHealth() {
    this.cronTask = cron.schedule("* * * * *", async () => {
      console.log("starting health check");
      const response = await this.defaultRequest();

      response.map((response) => {
        let index = this.rpcs.findIndex(
          (x) =>
            x.endpointURL.toLowerCase() ===
            response.rpc.endpointURL.toLowerCase()
        );

        if (response.error && !response.result) {
          this.rpcs[index].isDown = true;
        }

        if (response.result && !response.error) {
          this.rpcs[index].isDown = true;
        }
      });

      console.log("finished health check");
    });
  }

  async defaultRequest(): Promise<{ rpc: RPC; result?: any; error?: any }[]> {
    let rpcRequest: request = {
      method: "getVersion",
      params: [],
      start: new Date(),
    };

    // send the batch request here for the result

  }
}
