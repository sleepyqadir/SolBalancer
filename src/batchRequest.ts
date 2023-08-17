import { Request, RPC, Config } from "./types";
import axios from "axios";
import { readCacheFromRPCVault, saveCacheToRPCVault } from "./vault";

export const request = async (
  rpc: RPC,
  request: Request,
  config?: Config
): Promise<{
  rpc: RPC;
  result?: Request;
  error?: any;
  config?: Config;
}> => {
  console.log("started requesting...", rpc.endpointURL);

  let requestSnapshot: Request = {
    ...request,
    start: new Date(),
  };

  let cache = await readCacheFromRPCVault();

  if (
    config &&
    cache[request.method] &&
    config.interval >
      new Date().getTime() - new Date(cache[request.method].start).getTime()
  ) {
    const cached = cache[request.method];
    const { params: cachedParams } = cached;
    const { params: requestParams } = request;

    let isMatch = true;

    if (cachedParams.length !== requestParams.length) {
      isMatch = false;
    } else {
      for (let i = 0; i < cachedParams.length; i++) {
        if (requestParams[i] !== cachedParams[i]) {
          isMatch = false;
          break;
        }
      }
    }

    console.log("Match found:", isMatch, requestParams, cachedParams);

    if (isMatch) {
      rpc.totalResponses++;
      rpc.servedRequests++;

      return {
        rpc,
        result: cached,
        error: undefined,
      };
    }
  }

  try {
    const res = await axios({
      url: rpc.endpointURL,
      method: "POST",
      data: {
        method: request.method,
        params: request.params ?? [],
        jsonrpc: "2.0",
        id: "1",
      },
      timeout: 5000,
    });

    const data = await res.data;

    if (data.error) throw new Error(JSON.stringify(data.error));

    requestSnapshot.end = new Date();

    requestSnapshot.result = data;

    const responseTime =
      requestSnapshot.end.getTime() - requestSnapshot.start.getTime();
    rpc.totalResponseTime += responseTime;
    rpc.totalResponses++;

    cache[request.method] = requestSnapshot;
    await saveCacheToRPCVault(cache);

    rpc.averageResponseTime = rpc.totalResponseTime / rpc.totalResponses;
    rpc.servedRequests++;
    rpc.isDown = false;

    return {
      rpc,
      result: requestSnapshot,
    };
  } catch (e: any) {
    rpc.failedRequestsCount++;
    rpc.servedRequests++;

    const isRPCError = e && e.message && e.name === "Error";
    const isDownError =
      isRPCError &&
      (e.message.includes("not supported") ||
        e.message.includes("not available"));

    if (!isDownError) {
      rpc.isDown = true;
    }

    return {
      rpc,
      error: e,
    };
  }
};

export const batchRequest = async (
  rpcs: RPC[],
  req: Request,
  cache?: Config
) => {
  const responses = await Promise.all(
    rpcs.map((rpc) => {
      return request(rpc, req, cache);
    })
  );

  return responses.map((res: any) => ({
    rpc: res.rpc,
    response: res.result,
    error: res.error,
  }));
};
