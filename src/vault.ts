import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Cache, RPC, defaultRPC } from "./types";

const ROOT_DIRECTORY = ".solBalancer";

const getPath = (fileName: string) => path.join("./", ROOT_DIRECTORY, fileName);

const ensureRootDirectoryExists = async () => {
  const rootPath = getPath("");
  if (!existsSync(rootPath)) {
    await mkdir(rootPath);
  }
};

export const setupRPCVault = async () => {
  await ensureRootDirectoryExists();
  const initialConfig = {
    name: "solBalancer",
    version: "0.0.1",
  };
  await writeFile(getPath("config.json"), JSON.stringify(initialConfig));
};

export const saveToRPCVault = async (config: RPC[]) => {
  await ensureRootDirectoryExists();
  await writeFile(getPath(`rpcvault.json`), JSON.stringify(config));
};

export const readFromRPCVault = async (): Promise<RPC[]> => {
  const chainPath = getPath(`rpcvault.json`);
  if (!existsSync(chainPath)) {
    throw new Error("Data doesn't exist");
  }
  const data = await readFile(chainPath);
  return JSON.parse(data.toString());
};

export const saveCacheToRPCVault = async (cache: Cache) => {
  await ensureRootDirectoryExists();
  await writeFile(getPath(`rpcvault-cache.json`), JSON.stringify(cache));
};

export const readCacheFromRPCVault = async (): Promise<Cache> => {
  const cachePath = getPath(`rpcvault-cache.json`);
  if (!existsSync(cachePath)) {
    return {} as Cache;
  }
  const data = await readFile(cachePath);
  return JSON.parse(data.toString());
};

export const readConfig = async (rpcUrls: string[]): Promise<RPC[]> => {
  try {
    const vault = await readFromRPCVault();

    return rpcUrls.map((rpcUrl) => {
      const rpc = vault.find(
        (vaultRpc) =>
          vaultRpc.endpointURL.toLowerCase() === rpcUrl.toLowerCase()
      );
      return rpc || defaultRPC(rpcUrl);
    });
  } catch (error) {
    console.error(`Error while reading config`, error);
    return rpcUrls.map((rpcUrl) => defaultRPC(rpcUrl));
  }
};
