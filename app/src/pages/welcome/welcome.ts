import { Component }          from '@angular/core';
import { Http }               from '@angular/http';
import { NavController }      from 'ionic-angular';
import { AccountSigninPage }  from '../account-signin/account-signin';
import { GlobalStateService } from '../../services/global-state.service';
import { TabsPage }           from '../tabs/tabs';
import { Config }             from '../../config/config';
// import { UserState }       from '../../services/account-management.service';
import { CognitoUtil, UserLoginService, IUserLogin } from '../../services/account-management.service';
import { Logger } from '../../services/logger.service';
import { AccountSignupPage } from '../account-signup/account-signup';
import { BrowserTab } from '@ionic-native/browser-tab';
import { Deeplinks } from '@ionic-native/deeplinks';
import { Platform } from 'ionic-angular';

@Component({
  selector: 'welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  accountSigninPage = AccountSigninPage;
  tabsPage = TabsPage;
  initialized = false;
  cognitoUtil = null;

  constructor(public navCtrl: NavController, public globals: GlobalStateService, private browserTab: BrowserTab, private deeplinks: Deeplinks, private http: Http, private platform: Platform) {
    // hack workaround: instantiation so that the code can be loaded in time for the IonViewDidEnter() method
    this.cognitoUtil = new CognitoUtil();

    this.platform.ready().then((readySource) => {
      console.log('Platform ready from', readySource);
      // Platform now ready, execute any required native code

      this.deeplinks.route({
        '/callback': AccountSigninPage
      }).subscribe((match) => {
        //console.log('Successfully matched Deeplink route', match);
        CognitoUtil.getIdTokenFromAuthCode(match.$args.code, http).then((data) => {
          console.log('ID Token', data.id_token);
          console.log('Access Token', data.access_token);
          console.log('Refresh Token', data.refresh_token);
        }).catch((err) => {
          console.error('error', err);
        });
      }, (nomatch) => {
        console.error('Got a deeplink that did not match known routes', nomatch);
      });
    });
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

  launchHostedUi() {
    console.log('Cognito Hosted UI: ', CognitoUtil.getHostedUiLoginUrl());
    if (this.platform.is('cordova')) {
      // You're running in a Cordova app on a device. Use the browser tab plugin.
      this.browserTab.isAvailable()
      .then((isAvailable: boolean) => {
  
        if (isAvailable) {
  
          this.browserTab.openUrl(CognitoUtil.getHostedUiLoginUrl());
  
        } else {
          console.log('Browser tab not available');
          // open URL with InAppBrowser instead or SafariViewController
  
        }
      });

    } else {
      // You're testing in a browser. Redirect to the hosted UI. 
    }
  }

}
