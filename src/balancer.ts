import cron from "node-cron";
import { RPC, defaultRPC, Request, Config, defaultConfig } from "./types";
import { batchRequest } from "./batchRequest";
import { saveToRPCVault } from "./vault";

export class Balancer {
  public rpcs: RPC[] = [];
  public currentRPC: RPC = defaultRPC("");
  public cronTask: cron.ScheduledTask | undefined = undefined;
  public config: Config = defaultConfig();

  constructor(rpcs: RPC[], cache?: Config) {
    this.rpcs = rpcs;
    this.config = cache ?? defaultConfig();
  }

  private refreshRpc = (rpc: RPC) => {
    const index = this.rpcs.findIndex(
      (x) => x.endpointURL.toLowerCase() === rpc.endpointURL.toLowerCase()
    );

    this.rpcs[index] = rpc;
  };

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

  async request(request: Request): Promise<Request> {
    try {
      const rpc = this.nextRPC();

      let response = await batchRequest([rpc], request);
      let previousRPCs: any = {};

      while (response[0].error) {
        const rpc = this.nextRPC();

        if (previousRPCs[rpc.endpointURL]) continue;

        response = await batchRequest([rpc], request);

        previousRPCs[response[0].rpc.url] = true;

        const newRPC = {
          ...response[0].rpc,
        } as RPC;

        this.refreshRpc(newRPC);
      }

      this.refreshRpc(response[0].rpc);

      let success = false;
      while (!success) {
        try {
          await saveToRPCVault(this.rpcs);
          success = true;
        } catch (e) {
          success = false;
        }
      }

      if (response[0].response) {
        return response[0].response;
      } else {
        const newRPC = {
          ...response[0].rpc,
        } as RPC;

        this.refreshRpc(newRPC);
        throw response[0].error;
      }
    } catch (e) {
      throw {
        jsonrpc: "2.0",
        error: { code: -32042, message: "Method not supported" },
        id: "1",
      };
    }
  }

  async defaultRequest(): Promise<{ rpc: RPC; result?: any; error?: any }[]> {
    let request: Request = {
      method: "getVersion",
      params: [],
      start: new Date(),
    };

    let result = await batchRequest(this.rpcs, request);

    return result;
  }
}
