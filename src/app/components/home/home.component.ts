import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModemService } from 'modem';
import { Observable, Subscription } from "rxjs";
import { AppState } from "../../state/app.state";
import { Store } from "@ngrx/store";
import { selectRxMessages, selectTxMessage } from "../../state/app.selector";
import { changeTxMessage, clrRxMessages } from "../../state/app.action";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{

  txMessage$: Observable<string>;
  rxMessages$: Observable<string>;

  constructor(public modemService: ModemService, private store: Store<{app: AppState}>) {
    this.txMessage$ = store.select(selectTxMessage);
    this.rxMessages$ = store.select(selectRxMessages);
  }

  ngOnInit(): void {
  }

  sendMessage(message: string): void {
    this.modemService.send(message);
  }

  onChangeTxMessage(message: string) {
    this.store.dispatch(changeTxMessage({txMessage: message}));
  }

  clrReceivedMessages() {
    this.store.dispatch(clrRxMessages());
  }
}
