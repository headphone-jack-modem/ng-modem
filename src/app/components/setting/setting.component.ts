import { Component, OnInit } from '@angular/core';
import { Store } from "@ngrx/store";
import { AppState } from "../../state/app.state";
import { Observable } from "rxjs";
import {
  selectBaud,
  selectConfigTemplates,
  selectFreqHigh,
  selectFreqLow,
  selectSelectedConfig, selectSelectedDecoder
} from "../../state/app.selector";
import {
  changeBaud,
  changeSelectedConfig,
  changeFreqHigh,
  changeFreqLow,
  changeSelectedDecoder
} from "../../state/app.action";
import {Config} from "modem";

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  selectedDecoder$: Observable<string>;
  selectedConfig$: Observable<string>;
  configTemplates$: Observable<{configName: string, config: Config}[]>;
  baud$: Observable<number>;
  freqLow$: Observable<number>;
  freqHigh$: Observable<number>;

  constructor(private store: Store<{app: AppState}>, public audioContext: AudioContext) {
    this.selectedDecoder$ = store.select(selectSelectedDecoder)
    this.selectedConfig$ = store.select(selectSelectedConfig);
    this.configTemplates$ = store.select(selectConfigTemplates);
    this.baud$ = store.select(selectBaud);
    this.freqLow$ = store.select(selectFreqLow);
    this.freqHigh$ = store.select(selectFreqHigh);
  }


  ngOnInit(): void {
  }

  onChangeSelectedDecoder(selectedDecoder: string) {
    this.store.dispatch(changeSelectedDecoder({selectedDecoder: selectedDecoder}));
  }

  onChangeSelectedConfig(configName: string) {
    this.store.dispatch(changeSelectedConfig({configName: configName}));
  }

  onChangeBaud(baud: number) {
    this.store.dispatch(changeBaud({baud: baud}));
  }

  onChangeFreqLow(freqLow: number) {
    this.store.dispatch(changeFreqLow({freqLow: freqLow}));
  }

  onChangeFreqHigh(freqHigh: number) {
    this.store.dispatch(changeFreqHigh({freqHigh: freqHigh}));
  }
}
