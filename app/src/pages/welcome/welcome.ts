import { Component }          from '@angular/core';
import { NavController }      from 'ionic-angular';
import { AccountSigninPage }  from '../account-signin/account-signin';
import { GlobalStateService } from '../../services/global-state.service';
import { TabsPage }           from '../tabs/tabs';
import { CognitoUtil }        from '../../services/account-management.service';
import { Config }             from '../../config/config';
// import { UserState }       from '../../services/account-management.service';
import { UserLoginService, IUserLogin } from '../../services/account-management.service';
import { Logger } from '../../services/logger.service';
import { AccountSignupPage } from '../account-signup/account-signup';

@Component({
  selector: 'welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  accountSigninPage = AccountSigninPage;
  accountSignupPage = AccountSignupPage;
  tabsPage = TabsPage;
  initialized = false;
  cognitoUtil = null;

  constructor(public navCtrl: NavController, public globals: GlobalStateService) {
    // hack workaround: instantiation so that the code can be loaded in time for the IonViewDidEnter() method
    this.cognitoUtil = new CognitoUtil();
  }


  // this method will be called each time the Ionic View is loaded
  ionViewDidEnter() {

    Logger.banner("Welcome to SpaceFinder!");

    if (!this.initialized) {
      console.log('%cConfiguration: ', Logger.LeadInStyle, Config);
      // Auto-login
      if (Config['DEVELOPER_MODE']) {

        Logger.heading("User sign-in");

        let userData: IUserLogin = {
          username: "user1",
          password: "Test123!"
        };
        UserLoginService.signIn(userData).then(() => {
          // set the property, so that Angular2's two-way variable binding works
          this.globals.userId = this.globals.getUserId();
        })
      }
    }
    /*
    // console.log(`UserState: ${CognitoUtil.getUserState()}`);
    // only call this once, the first time that the user starts up the app,
    // and only if the user is considered logged in, based on the local storage value
    if ((!this.initialized) && (CognitoUtil.getUserState() == UserState.SignedIn)) {
      console.log('Initializing user state');
      try {
        let cognitoUser = CognitoUtil.getCognitoUser();
        console.log(cognitoUser);
        if (cognitoUser.getUsername()) {
        }
      } catch (e) {
        console.log(`Unable to retrieve user's session info from localStorage`);
        console.log(e);
      }
    }
    */
    this.initialized = true;
  }

}
