import { Subject } from "rxjs";
import { Config } from "./config";

export abstract class Decoder {
  abstract onReceive: Subject<string>;
  abstract demodulate(samples: Float32Array): void;
  abstract setConfig(config: Config): void;
}
