import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { AccountSigninPage } from '../account-signin/account-signin';
import { ResourceAddPage } from '../resource-add/resource-add';
import { Resource } from "../../services/spacefinder-sdk/model/Resource";
import { UserLoginService } from "../../services/account-management.service";
import { ResourceAvailabilityPage } from '../resource-availability/resource-availability';
import { CustomAuthorizerClient, IamAuthorizerClient } from "../../services/spacefinder-api.service";
import { Logger } from '../../services/logger.service';


@Component({
  templateUrl: 'resource-list.html',
})
export class ResourceListPage {

  initialized = false;
  accountSigninPage = AccountSigninPage;
  resourceAddPage = ResourceAddPage;
  location = null;
  resources: Resource[] = [];


  displayDeleteResourceConfirmation(resourceId, resourceName) {
    console.log("Deleting resourceID " + resourceId);

    let confirm = this.globals.getAlertController().create({
      title: 'Delete resource?',
      message: `Are you sure you want to delete [<b>${resourceName}</b>]? All bookings associated with the resource will also be deleted!`,
      buttons: [
        {
          text: 'Cancel',
        },
        {
          text: 'OK',
          handler: () => {
            this.deleteResource(this.location.locationId, resourceId)
            .then(() => {
              this.globals.dismissLoader();
               this.globals.displayToast(`[${resourceName}] has been successfully deleted`);
            })
            .catch((err) => {
              this.globals.dismissLoader();
              this.globals.displayAlert('Error encountered',
                `Attempt to delete resource failed. Please check the console logs for more information.`);
              console.error(err);
            });
          }
        }
      ]
    });
    confirm.present();
  }

  deleteResource(locationId, resourceId): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // delete from the database
      this.globals.displayLoader("Deleting...");
      this.customAuthClient.getClient().resourcesDelete(locationId, resourceId).subscribe(
        () => {
          // remove the item from the resources array
          let index = this.resources.findIndex( resource => { return resource.resourceId == resourceId});
          if (index > -1) {
            this.resources.splice(index, 1);
          }
          resolve();
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  private loadResources(locationId): void {
    this.iamAuthClient.getClient().resourcesList(locationId).subscribe(
      (data) => {
        this.resources = data.items.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
        this.globals.dismissLoader();
        this.initialized = true;
      },
      (err) => { console.error(err); }
    );
  };

  ionViewDidEnter() {
    Logger.banner("Resources");
  
    this.initialized = true;
    this.resources = [];
    if (UserLoginService.getAwsAccessKey() != null) {
      this.initialized = false;
    // if (CognitoUtil.getUserState() === UserState.SignedIn) {
      // console.log(AWS.config.credentials);
      UserLoginService.getAwsCredentials()
      .then(() => {
        this.globals.displayLoader("Loading...");
        this.loadResources(this.location.locationId);
      })
      .catch((err) => {
        console.log("ERROR: Unable to fetch AWS credentials!");
        console.log(err)
      })

    }
  }

  ionViewDidLeave() {
    this.initialized = false;
    this.resources = [];
  }

  gotoResourceAvailabilityPage(location, resource) {
    let navParams = {
      "location": location,
      "resource": resource
    };
    this.navCtrl.push(ResourceAvailabilityPage, navParams);
  }

  gotoResourceAddPage(location) {
    let navParams = {
      "location": location,
    };
    this.navCtrl.push(ResourceAddPage, navParams);
  }

  constructor(public navCtrl: NavController,  public navParams: NavParams, public globals: GlobalStateService, private customAuthClient: CustomAuthorizerClient, private iamAuthClient: IamAuthorizerClient) {
    this.location = navParams.data;
  }

}
