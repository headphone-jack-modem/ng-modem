import { Config } from "modem";

export interface AppState {
  txMessage: string;
  rxMessages: string;
  selectedDecoder: string;
  selectedConfig: string;
  costumeConfig: Config;
  configTemplates: {configName: string; config: Config}[];
}
