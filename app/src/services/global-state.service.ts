import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import {CognitoUtil, UserLoginService, LocalStorage} from './account-management.service';
import { Logger } from './logger.service';


@Injectable()
export class GlobalStateService {


  private viewAdminFeaturesOverride: boolean = false;
  private loader = null;

  // this needs to be a variable in order to support two-way binding,
  // to refresh the Angular2 templates when this value changes
  public userId = '';

  constructor(public alertCtrl: AlertController, public toastCtrl: ToastController, public loadingCtrl: LoadingController) {
  }

  getUserId(): string {
    return CognitoUtil.getUserId();
  }

  getUnencodedUserId(): string {
    let userId = CognitoUtil.getUserId();
    return userId == null ? '' : userId
  }

  getUsername(): string {
    return CognitoUtil.getUsername();
  }

  getUserFirstName(): string {
    if (CognitoUtil.getUserProfile() && CognitoUtil.getUserProfile()['given_name']) {
      return (CognitoUtil.getUserProfile()['given_name'])
    }
    return '';
  }

  getUserLastName(): string {
    if (CognitoUtil.getUserProfile() && CognitoUtil.getUserProfile()['family_name']) {
      return CognitoUtil.getUserProfile()['family_name'];
    }
    return null;
  }

  getUserFullName(): string {
    if (CognitoUtil.getUserProfile() && CognitoUtil.getUserProfile()['given_name'] && CognitoUtil.getUserProfile()['family_name']) {
      return CognitoUtil.getUserProfile()['given_name'] + ' ' + CognitoUtil.getUserProfile()['family_name'];
    }
    return null;
  }

  getViewAdminFeaturesOverride() {
    return this.viewAdminFeaturesOverride;
  }
  setViewAdminFeaturesOverride(setting : boolean): void {
    this.viewAdminFeaturesOverride = setting;
  }

  displayAdminFeatures(): boolean {
    return this.isAdminRole() || this.viewAdminFeaturesOverride;
  }


  isAdminRole(): boolean {
    return CognitoUtil.getUserGroup() == 'adminGroup';
  }

  getAlertController() {
    return this.alertCtrl;
  }

  logout(navController = null) {
    Logger.banner("Sign Out");
    this.showLogoutAlert();
    UserLoginService.signOut();
    this.userId = '';
    if (navController) {
      navController.popToRoot({animate: false});
    }
  }

  showLogoutAlert(): void {
    let alert = this.alertCtrl.create({
      title: 'Signed out',
      subTitle: 'You have signed out of the system.',
      buttons: [{
          text: 'OK',
        }]
    });
    alert.present();
  }

  displayAlert(title, subtitle, functionToRunWhenOkButtonIsPressed=null) {
    let okFunction = () => {};
    if (functionToRunWhenOkButtonIsPressed != null) {
      okFunction = functionToRunWhenOkButtonIsPressed;
    }
    let alert = this.getAlertController().create({
      title: title,
      subTitle: subtitle,
      buttons: [{ text: 'OK', handler: okFunction }]
    });
    alert.present();
  }
  displayToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }

  displayLoader(message, durationInMilliseconds=3000) {
    this.loader = this.loadingCtrl.create({
      content: message,
      duration: durationInMilliseconds,
      dismissOnPageChange: true
    });
    this.loader.present();
  }

  dismissLoader() {
    if (this.loader != null) {
      this.loader.dismiss();
    }
    this.loader = null;
  }
}
