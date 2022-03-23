import { Component } from '@angular/core';
import { ModemService } from "modem";
import { Store } from "@ngrx/store";
import { AppState } from "./state/app.state";
import { selectRxMessages, selectTxMessage } from "./state/app.selector";
import { Observable, Subscription } from "rxjs";
import { getRxMessage } from "./state/app.action";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-modem';
  public onReceive: Subscription;
  constructor(public modemService: ModemService, private store: Store<{app: AppState}>) {
    this.onReceive = modemService.onReceive.subscribe(message => store.dispatch(getRxMessage({rxMessage: message})));
  }
}
