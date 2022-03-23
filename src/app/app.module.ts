import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from "./shared/material.module";
import { HomeComponent } from './components/home/home.component';
import { SettingComponent } from './components/setting/setting.component';
import { GuideComponent } from './components/guide/guide.component';
import { AppRoutingModule } from "./app-routing.module";
import { FormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ModemModule } from "modem";
import {StoreModule} from "@ngrx/store";
import {reducer} from "./state/app.reducer";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { environment } from "../environments/environment";
import { EffectsModule } from "@ngrx/effects";
import { AppEffect } from "./state/app.effect";
import { AboutMeComponent } from './components/about-me/about-me.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SettingComponent,
    GuideComponent,
    AboutMeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MaterialModule,
    AppRoutingModule,
    FormsModule,
    ModemModule,
    StoreModule.forRoot({app: reducer}),
    StoreDevtoolsModule.instrument({
      name: 'Micro Modem',
      maxAge: 30,
      logOnly: environment.production
    }),
    EffectsModule.forRoot([AppEffect])
  ],
  providers: [AudioContext],
  bootstrap: [AppComponent]
})
export class AppModule { }
