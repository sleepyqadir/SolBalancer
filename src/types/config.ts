export interface Config {
  interval: number;
}

export const defaultConfig = () =>
  ({
    interval: 0,
  } as Config);
