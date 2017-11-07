import { Component }          from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { NavController }      from 'ionic-angular';
import { AlertController }    from 'ionic-angular';
import { AccountSigninPage }  from '../account-signin/account-signin';
import { AccountSignupPage } from '../account-signup/account-signup';
import { GlobalStateService } from '../../services/global-state.service';
import { TabsPage }           from '../tabs/tabs';
import { Config }             from '../../config/config';
// import { UserState }       from '../../services/account-management.service';
import { CognitoUtil, UserLoginService, IUserLogin } from '../../services/account-management.service';
import { Logger } from '../../services/logger.service';
import { BrowserTab } from '@ionic-native/browser-tab';
import { Deeplinks } from '@ionic-native/deeplinks';
import { Platform } from 'ionic-angular';

@Component({
  selector: 'welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  accountSigninPage = AccountSigninPage;
  accountSignupPage = AccountSignupPage;
  tabsPage = TabsPage;
  alertCtrl : AlertController = this.globals.getAlertController();
  initialized = false;
  cognitoUtil = null;

  constructor(public navCtrl: NavController, public globals: GlobalStateService, private browserTab: BrowserTab, private deeplinks: Deeplinks, private http: Http, private platform: Platform) {
    // hack workaround: instantiation so that the code can be loaded in time for the IonViewDidEnter() method
    this.cognitoUtil = new CognitoUtil();

    this.platform.ready().then((readySource) => {
      console.log('Platform ready from', readySource);
      // Platform now ready, execute any required native code

      if (this.platform.is('cordova')) {
        // App running on mobile device; Deep linking supported with custom URL schemes
        let platform = 'mobile';
        this.deeplinks.route({
          '/callback': AccountSigninPage
        }).subscribe((match) => {
          console.log('Successfully invoked mobile callback deeplink route', match);
          this.completeSignIn(match.$args.code, platform, http);
        }, (nomatch) => {
          console.error('Got a deeplink that did not match known routes', nomatch);
        });
      } else {
        // App running in browser without Cordova. Deep linking not supported, so redirects used instead
        let platform = 'web';
        if (window.location.search) {
          let params = new URLSearchParams(window.location.search);
          let authCode = params.get('?code');
          console.log('authCode',authCode);
          this.completeSignIn(authCode, platform, http).then(() => {
            // Reset query parameters from URL in browser
            let clean_uri = location.protocol + "//" + location.host + location.pathname;
            window.history.replaceState({}, document.title, clean_uri);
          });
        }
      }
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
    if (this.platform.is('cordova')) {
      // You're running in a Cordova app on a device. Use the browser tab plugin.
      this.browserTab.isAvailable()
      .then((isAvailable: boolean) => {
        if (isAvailable) {
          console.log('Cognito Hosted UI: ', CognitoUtil.getHostedUiLoginMobileUrl());
          this.browserTab.openUrl(CognitoUtil.getHostedUiLoginMobileUrl());
        } else {
          console.log('Browser tab not available');
          // open URL with InAppBrowser instead or SafariViewController
        }
      });
    } else {
      // You're testing in a browser. Redirect to the hosted UI.
      console.log('Cognito Hosted UI: ', CognitoUtil.getHostedUiLoginWebUrl());
      window.location.href = CognitoUtil.getHostedUiLoginWebUrl();
    }
  }

  completeSignIn(authCode: string, platform: string, http: Http) {
    return CognitoUtil.getIdTokenFromAuthCode(authCode, platform, http).then((data) => {
      this.globals.displayLoader('Signing in...');
      console.log('Sign-in spinner');
      return UserLoginService.completeSignIn(data.access_token, data.id_token, data.refresh_token)
      .then(() => {
        // Login was successful
        this.globals.dismissLoader();
        return this.showLoginSuccessAlert(this.globals.getUsername(), () => {
          this.globals.userId = this.globals.getUserId();
          this.globals.setViewAdminFeaturesOverride(this.globals.isAdminRole());
          this.navCtrl.popToRoot({animate: false});
          // this.navCtrl.push(WelcomePage);
        });
      }).catch((err: Error): void => {
        // Login was unsuccessful
        this.globals.dismissLoader();
        console.error(err);
        // this.allowButtonPresses = true;
      });
    }).catch((err) => {
      console.error('error', err);
    });
  }

  showLoginSuccessAlert(username: String, callbackHandler: () => void): void {
    let subtitle = `You are now signed in.`;
    if (this.globals.isAdminRole()) {
      subtitle = `You are now signed in as an Administrator.`
    }
    let alert = this.alertCtrl.create({
      title: 'Success!',
      subTitle: subtitle,
      message: `Username: <b>${username}</b><br/>First name: <b>${this.globals.getUserFirstName()}</b><br/>Last name: <b>${this.globals.getUserLastName()}</b>`,
      buttons: [{
          text: 'OK',
          handler: data => {
            callbackHandler();
          }
        }]
    });
    alert.present();
  }



}
