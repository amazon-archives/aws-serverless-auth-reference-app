import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from 'ionic-native';
import { TabsPage } from '../pages/tabs/tabs';
import { UserRegistrationService }     from '../services/account-management.service';
import { Logger }     from '../services/logger.service';
import { GlobalStateService } from '../services/global-state.service';

@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`,
  providers: [UserRegistrationService, GlobalStateService, Logger]
})
export class MyApp {
  rootPage = TabsPage;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
    });
  }
}
