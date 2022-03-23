import { Action, createAction, props } from "@ngrx/store";
import { Config } from "modem";

export enum AppActionTypes {
  ChangeTxMessage = '[Home] Change Sending Message',
  GetRxMessage = '[Home] Get Received Message',
  ClrRxMessages = '[Home] Clear Received Messages',
  ChangeSelectedDecoder = '[Setting] Change Selected Decoder',
  ChangeSelectedConfig = '[Setting] Change Selected Config',
  ChangeBuad = '[Setting] Change Buad Rate',
  ChangeFreqLow = '[Setting] Change Low frequency',
  ChangeFreqHigh = '[Setting] Change High frequency'
}

export const changeTxMessage = createAction(
  AppActionTypes.ChangeTxMessage,
  props<{ txMessage: string }>()
);

export const getRxMessage = createAction(
  AppActionTypes.GetRxMessage,
  props<{ rxMessage: string }>()
);

export const clrRxMessages = createAction(
  AppActionTypes.ClrRxMessages
);

export const changeSelectedDecoder = createAction(
  AppActionTypes.ChangeSelectedDecoder,
  props<{selectedDecoder: string}>()
);

export const changeSelectedConfig = createAction(
  AppActionTypes.ChangeSelectedConfig,
  props<{ configName: string }>()
);

export const changeBaud = createAction(
  AppActionTypes.ChangeBuad,
  props<{ baud: number }>()
);

export const changeFreqLow = createAction(
  AppActionTypes.ChangeFreqLow,
  props<{ freqLow: number }>()
);

export const changeFreqHigh = createAction(
  AppActionTypes.ChangeFreqHigh,
  props<{ freqHigh: number }>()
);
