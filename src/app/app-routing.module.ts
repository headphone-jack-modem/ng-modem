import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {HomeComponent} from "./components/home/home.component";
import {SettingComponent} from "./components/setting/setting.component";
import {GuideComponent} from "./components/guide/guide.component";
import { AboutMeComponent } from "./components/about-me/about-me.component";

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'setting', component: SettingComponent},
  {path: 'guide', component: GuideComponent},
  {path: 'about-me', component: AboutMeComponent},
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  // {path: '**', redirectTo: '/home', pathMatch: 'full'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {useHash: true})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
