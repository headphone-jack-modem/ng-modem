import { Config } from "./config";

export abstract class Encoder {
  abstract modulate(message: string): Float32Array;
  abstract setConfig(config: Config): void;
}
