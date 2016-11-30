import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { UserLoginService } from '../../services/account-management.service';
import { Logger } from '../../services/logger.service';

@Component({
  templateUrl: 'account-change-password.html',
})

export class AccountChangePasswordPage {

  formData: {
    currentPassword?: string,
    newPassword?: string
  } = {};

  submitted: boolean = false;

  onSubmit(form) {
    this.submitted = true;

    if (form && form.valid) {
      console.log('Form User data' + this.formData);
      UserLoginService.changePassword(this.formData.currentPassword, this.formData.newPassword)
      .then((data) => {
        // Success
        console.log("Password successfully changed");
        let handler = () => {
          // go back to the Signin screen
          this.navCtrl.pop();
        }
        this.globals.displayAlert('Password changed',
          'Your password has been successfully changed.', handler); 
      }).catch((err: Error) => {
        // Failure
        console.log('Failure when attempting to change password', err);
        console.log(err);
        this.globals.displayAlert('Error encountered',
    `There was a problem changing your password: [${err.name}. ${err.message}]. Please try again.`, null);
      });
    }
  }

  constructor(public navCtrl: NavController, private globals: GlobalStateService) {
    // empty
  }

  ionViewDidEnter() {
    Logger.banner("Change Password");
  }
}