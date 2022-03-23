import { AppState } from "./app.state";
import {
  getRxMessage,
  changeTxMessage,
  clrRxMessages,
  changeBaud,
  changeFreqLow,
  changeFreqHigh,
  changeSelectedConfig, changeSelectedDecoder
} from "./app.action";
import { createReducer, on } from "@ngrx/store";
import { Config } from "modem";

const initialState: AppState = {
  txMessage: "Tx MSG",
  rxMessages: "",
  selectedDecoder: 'dft',
  costumeConfig: {baud: 1600, freqLow: 4800, freqHigh: 11200},
  configTemplates: [
    {configName: 'fast', config: {baud: 1600, freqLow: 4800, freqHigh: 11200}},
    {configName: 'medium', config: {baud: 882, freqLow: 4410, freqHigh: 9702}},
  ],
  selectedConfig: 'fast'
}

export const reducer = createReducer(
  initialState,
  on(changeTxMessage, (state, {txMessage}) => ({...state, txMessage: txMessage})),
  on(getRxMessage, (state, {rxMessage}) => ({...state, rxMessages: rxMessage.concat("\n" + state.rxMessages)})),
  on(clrRxMessages, (state) => ({...state, rxMessages: ""})),
  on(changeSelectedDecoder, (state, {selectedDecoder}) => ({...state, selectedDecoder: selectedDecoder})),
  on(changeSelectedConfig, (state, {configName}) => ({...state, selectedConfig: configName})),
  on(changeBaud, (state, {baud}) => ({...state, costumeConfig: {...state.costumeConfig, baud: baud}})),
  on(changeFreqLow, (state, {freqLow}) => ({...state, costumeConfig: {...state.costumeConfig, freqLow: freqLow}})),
  on(changeFreqHigh, (state, {freqHigh}) => ({...state, costumeConfig: {...state.costumeConfig, freqLow: freqHigh}})),
)
