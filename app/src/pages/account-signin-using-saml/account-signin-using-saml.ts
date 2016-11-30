import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { Logger } from '../../services/logger.service';


@Component({
  templateUrl: 'account-signin-using-saml.html',
})

export class AccountSigninUsingSAMLPage {
  signInButtonClicked: boolean = false;

  onSignIn(form) {
    this.signInButtonClicked = true;

    if (form && form.valid) {
      // this.login();
    }
  }

  constructor(public navCtrl: NavController, private globals: GlobalStateService) {

  }

  ionViewDidEnter() {
    Logger.banner("Sign-In Using SAML");
  }
}
