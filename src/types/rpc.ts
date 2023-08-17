export interface RPC {
  servedRequests: number;
  currentlyServing: number;
  averageResponseTime: number;
  totalResponseTime: number;
  totalResponses: number;
  endpointURL: string;
  isDown: boolean;
  failedRequestsCount: number;
  priorityWeight: number;
}

export const defaultRPC = (url: string) =>
  ({
    servedRequests: 0,
    currentlyServing: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    totalResponses: 0,
    endpointURL: url,
    isDown: false,
    failedRequestsCount: 0,
    priorityWeight: 0,
  } as RPC);
