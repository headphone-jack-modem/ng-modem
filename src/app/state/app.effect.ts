import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from "@ngrx/effects";
import { mergeMap, tap, withLatestFrom } from "rxjs/operators";
import { ComparatorDecoder, Config, DFTDecoder, ModemService } from "modem";
import { Store } from "@ngrx/store";
import { AppState } from "./app.state";
import {
  selectCostumeConfig,
  selectConfigTemplates,
  selectSelectedConfig,
  selectSelectedDecoder
} from "./app.selector";
import { AppActionTypes } from "./app.action";

@Injectable()
export class AppEffect {

  constructor(private actions$: Actions, private audioContext: AudioContext, private modemService: ModemService, private store: Store<{ app: AppState }>) {
  }

  changeConfig$ = createEffect(() => this.actions$.pipe(
    ofType(
      AppActionTypes.ChangeSelectedConfig,
      AppActionTypes.ChangeBuad,
      AppActionTypes.ChangeFreqLow,
      AppActionTypes.ChangeFreqHigh
    ),
    concatLatestFrom(() => [
      this.store.select(selectSelectedConfig),
      this.store.select(selectCostumeConfig),
      this.store.select(selectConfigTemplates)
    ]),
    tap(([action, selectedConfig, costumeConfig, configTemplates]) => {
      let c = configTemplates.find(configTemplate => configTemplate.configName === selectedConfig)?.config || costumeConfig;
      this.modemService.setConfig(c);
    })
  ), {dispatch: false});

  changeDecoder$ = createEffect(() => this.actions$.pipe(
    ofType(AppActionTypes.ChangeSelectedDecoder),
    concatLatestFrom(() => this.store.select(selectSelectedDecoder)),
    tap(([action, selectedDecoder]) => {
      let config = this.modemService.getConfig();
      let sampleRate = this.audioContext.sampleRate;
      let decoder = selectedDecoder === "dft" ? new DFTDecoder(config, sampleRate) : new ComparatorDecoder(config, sampleRate);
      this.modemService.setDecoder(decoder);
    })
  ), {dispatch: false});
}
