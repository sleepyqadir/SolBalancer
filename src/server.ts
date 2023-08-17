import express, { Express, Request, Response } from "express";
import { SolBalancer } from "./index";

const PORT: string | number = process.env.PORT ?? 9090;

const app: Express = express();
app.use(express.json());

const rpcUrls: string[] = ["https://api.mainnet-beta.solana.com"];

let solBalancerPromise= SolBalancer.rpcProvider(rpcUrls);

app.post("/", async (req: Request, res: Response) => {
  try {
    const { method, params } = req.body;

    if (!method || !Array.isArray(params)) {
      return res.status(400).send({ error: "Invalid request body" });
    }

    const solBalancer = await solBalancerPromise;

    const response = await solBalancer.request({
      method,
      params,
      start: new Date(),
    });

    res.status(200).send(response.result);
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`SolBalancer listening on http://localhost:${PORT}`);
});
