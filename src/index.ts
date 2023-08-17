import { readConfig, setupRPCVault } from "./vault";
import { batchRequest } from "./batchRequest";
import { Balancer } from "./balancer";
import { Request, RPC } from "./types";

export class SolBalancer {
  static async rpcProvider(rpcUrls: string[]): Promise<Balancer> {
    try {
      await setupRPCVault();

      const rpcs: RPC[] = await readConfig(rpcUrls);

      const rpcRequest: Request = {
        method: "getVersion",
        params: [],
        start: new Date(),
      };

      const result = await batchRequest(rpcs, rpcRequest);

      console.log({ result });

      const updatedRpcs = result
        .filter((x) => x.error === undefined)
        .map((x) => x.rpc);

      console.log({ updatedRpcs });

      return new Balancer(updatedRpcs);
    } catch (e) {
      console.error("Error creating Balancer:", e);
      throw e;
    }
  }
}
