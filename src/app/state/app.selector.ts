import { AppState } from "./app.state";
import { createSelector } from "@ngrx/store";

export const selectAppState = (state: { app: AppState; }) => state.app;

export const selectTxMessage = createSelector(
  selectAppState,
  appState => appState.txMessage
)

export const selectRxMessages = createSelector(
  selectAppState,
  appState => appState.rxMessages
)

export const selectSelectedDecoder = createSelector(
  selectAppState,
  appState => appState.selectedDecoder
)

export const selectSelectedConfig = createSelector(
  selectAppState,
  appState => appState.selectedConfig
)

export const selectCostumeConfig = createSelector(
  selectAppState,
  appState => appState.costumeConfig
)

export  const selectConfigTemplates = createSelector(
  selectAppState,
  appState => appState.configTemplates
)

export const selectBaud = createSelector(
  selectSelectedConfig,
  selectCostumeConfig,
  selectConfigTemplates,
  (selectedConfig, costumeConfig, configTemplates) =>
    (configTemplates.find(ct => ct.configName === selectedConfig)?.config || costumeConfig).baud
)

export const selectFreqLow = createSelector(
  selectSelectedConfig,
  selectCostumeConfig,
  selectConfigTemplates,
  (selectedConfig, costumeConfig, configTemplates) =>
    (configTemplates.find(ct => ct.configName === selectedConfig)?.config || costumeConfig).freqLow
)

export const selectFreqHigh = createSelector(
  selectSelectedConfig,
  selectCostumeConfig,
  selectConfigTemplates,
  (selectedConfig, costumeConfig, configTemplates) =>
    (configTemplates.find(ct => ct.configName === selectedConfig)?.config || costumeConfig).freqHigh
)
