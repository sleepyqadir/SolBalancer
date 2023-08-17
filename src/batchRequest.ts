import { Request } from "./types/request";
import { RPC } from "./types/rpc";
import axios from "axios";

export const request = async (
  rpc: RPC,
  request: Request
): Promise<{ rpc: RPC; result?: Request; error?: any }> => {
  console.log("started requesting...", rpc.endpointURL);

  let requestSnapshot: Request = {
    ...request,
    start: new Date(),
  };

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

export const batchRequest = async (rpcs: RPC[], req: Request) => {
  const responses = await Promise.all(
    rpcs.map((rpc) => {
      return request(rpc, req);
    })
  );

  return responses.map((res: any) => ({
    rpc: res.rpc,
    response: res.result,
    error: res.error,
  }));
};
