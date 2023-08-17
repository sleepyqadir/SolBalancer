import { readConfig, setupRPCVault } from "./vault";
import { batchRequest } from "./batchRequest";
import { Balancer } from "./balancer";
import { Request } from "./types";

export class SolBalancer {
    static rpcProvider = async (rpcUrls: string[]) => {
        await setupRPCVault()
        let rpcs = await readConfig(rpcUrls)
        
        let rpcRequest: Request = {
            method: 'getVersion',
            params: [],
            start: new Date()
        }

        let result = await batchRequest(rpcs, rpcRequest)
        rpcs = result.map(x => x.rpc)
        return new Balancer(rpcs)
    }
}