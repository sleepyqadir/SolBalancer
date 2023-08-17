import cron from "node-cron";
import { RPC, defaultRPC, Request, Config, defaultConfig } from "./types";
import { batchRequest } from "./batchRequest";
import { saveToRPCVault } from "./vault";

export class Balancer {
  private rpcs: RPC[];
  private currentRPC: RPC;
  private cronTask?: cron.ScheduledTask;
  private config: Config;

  constructor(rpcs: RPC[], cache?: Config) {
    this.rpcs = rpcs;
    this.currentRPC = defaultRPC("");
    this.config = cache ?? defaultConfig();
  }

  private refreshRpc(rpc: RPC): void {
    const index = this.rpcs.findIndex(
      (x) => x.endpointURL.toLowerCase() === rpc.endpointURL.toLowerCase()
    );
    this.rpcs[index] = rpc;
  }

  private nextRPC(): RPC {
    const notDownRpcs = this.rpcs.filter((rpc) => !rpc.isDown);
    const sortedRpcs = notDownRpcs.sort(
      (a, b) => a.averageResponseTime - b.averageResponseTime
    );

    this.currentRPC = sortedRpcs.length > 0 ? sortedRpcs[0] : this.rpcs[0];

    return this.currentRPC;
  }

  public checkRPCHealth(): void {
    this.cronTask = cron.schedule("* * * * *", async () => {
      console.log("Starting health check");

      const responses = await this.defaultRequest();
      responses.forEach((response) => {
        const rpc = this.rpcs.find(
          (x) =>
            x.endpointURL.toLowerCase() ===
            response.rpc.endpointURL.toLowerCase()
        );
        if (rpc) {
          rpc.isDown = response.error ? true : false;
        }
      });

      console.log("Finished health check");
    });
  }

  public async request(request: Request): Promise<Request> {
    try {
      let rpc = this.nextRPC();
      let response = await batchRequest([rpc], request);

      console.log({ response });

      const triedRPCs: { [endpoint: string]: boolean } = {};

      while (response[0].error) {
        rpc = this.nextRPC();

        if (triedRPCs[rpc.endpointURL]) continue;

        response = await batchRequest([rpc], request);
        triedRPCs[response[0].rpc.endpointURL] = true;
        this.refreshRpc(response[0].rpc);
      }

      this.refreshRpc(response[0].rpc);
      await saveToRPCVault(this.rpcs);

      return response[0].response || Promise.reject(response[0].error);
    } catch (e) {
      throw {
        jsonrpc: "2.0",
        error: { code: -32042, message: "Method not supported" },
        id: "1",
      };
    }
  }

  private async defaultRequest(): Promise<
    { rpc: RPC; result?: any; error?: any }[]
  > {
    const request: Request = {
      method: "getVersion",
      params: [],
      start: new Date(),
    };

    return await batchRequest(this.rpcs, request);
  }
}
