import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { AccountSigninPage } from '../account-signin/account-signin';
import { AccountSignupPage } from '../account-signup/account-signup';
import { LocationAddPage } from '../location-add/location-add';
import { Location } from "../../services/spacefinder-sdk/model/Location";
import { UserLoginService } from "../../services/account-management.service";
import { ResourceListPage } from '../resource-list/resource-list';
import { CustomAuthorizerClient, NoAuthorizationClient, UserPoolsAuthorizerClient } from "../../services/spacefinder-api.service";
import { Config }             from '../../config/config'
import { Logger } from '../../services/logger.service';

declare const AWS: any;

@Component({
  templateUrl: 'location-list.html',
})
export class LocationListPage {

  initialized = false;
  accountSigninPage = AccountSigninPage;
  accountSignupPage = AccountSignupPage;
  locationAddPage = LocationAddPage;
  locations: Location[] = [];
  resourceListPage = ResourceListPage;

  displayDeleteLocationConfirmation(locationId, locationName) {
    console.log("Deleting locationID " + locationId);

    let confirm = this.globals.getAlertController().create({
      title: 'Delete location?',
      message: `Are you sure you want to delete [<b>${locationName}</b>]? All resources and bookings associated with [<b>${locationName}</b>] will also be deleted!`,
      buttons: [
        {
          text: 'Cancel',
          handler: () => { /* do nothing */ }
        },
        {
          text: 'OK',
          handler: () => {
            this.deleteLocation(locationId)
            .then(() => {
              this.globals.dismissLoader();
              this.globals.displayToast(`Location [${locationName}] has been successfully deleted`);
            })
            .catch((err) => {
              this.globals.dismissLoader();
              this.globals.displayAlert('Error encountered',
                'Delete failed. Please check the console logs for more information.');
              console.log(err);
            });
          }
        }
      ]
    });
    confirm.present();
  }

  deleteLocation(locationId): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // delete from the database
      this.globals.displayLoader("Deleting...");
      this.customAuthClient.getClient().locationsDelete(locationId).subscribe(
        () => {
          // remove the item from the locations array
          let index = this.locations.findIndex( location => { return location.locationId == locationId});
          if (index > -1) {
            this.locations.splice(index, 1);
          }
          resolve();
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  gotoResourceListPage(location) {
    this.navCtrl.push(ResourceListPage, location);
  }

  loadLocationsWithAuth(): void {
    this.locations = [];
    this.userPoolsAuthClient.getClient().locationsList().subscribe(
      (data) => {
        // this.locations = data.items
        // sort by name
        this.locations = data.items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        this.globals.dismissLoader();
        this.initialized = true;
      },
      (err) => {
        this.globals.dismissLoader();
        this.initialized = true; 
        console.error(err);
        this.globals.displayAlert('Error encountered',
          `An error occurred when trying to load the locations. Please check the console logs for more information.`)
      }
    );
  };

  loadLocationsWithoutAuth(): void {
    this.locations = [];
    this.noAuthClient.getClient().locationsList().subscribe(
      (data) => {
        // this.locations = data.items
        // sort by name
        this.locations = data.items.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
        this.globals.dismissLoader();
        this.initialized = true;
      },
      (err) => {
        this.globals.dismissLoader();
        this.initialized = true; 
        console.error(err);
        this.globals.displayAlert('Error encountered',
          `An error occurred when trying to load the locations. Please check the console logs for more information.`)
      }
    );
  };


  constructor(private navCtrl: NavController,  public globals: GlobalStateService, private noAuthClient: NoAuthorizationClient, private customAuthClient: CustomAuthorizerClient, private userPoolsAuthClient: UserPoolsAuthorizerClient) {
  }
  ionViewDidEnter() {

    Logger.banner("Locations");

    this.initialized = true;
    this.locations = [];

    if (Config['DEVELOPER_MODE']) {
      this.initialized = false;
      
      if (UserLoginService.getAwsAccessKey() != null) {
      // if (CognitoUtil.getUserState() === UserState.SignedIn) {
        // console.log(AWS.config.credentials);
        UserLoginService.getAwsCredentials()
        .then(() => {
          this.globals.displayLoader("Loading...");
          this.loadLocationsWithAuth();
        })
        .catch((err) => {
          console.log("ERROR: Unable to load locations!");
          console.log(err)
        })
      }
    }
  }

  ionViewDidLeave() {
    this.initialized = false;
    this.locations = [];
  }

}
