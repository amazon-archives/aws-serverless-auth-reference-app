import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { GlobalStateService } from '../../services/global-state.service';
import { CustomAuthorizerClient } from "../../services/spacefinder-api.service";
import { Logger } from '../../services/logger.service';


declare const AWS: any;

@Component({
  templateUrl: 'resource-add.html',
})

export class ResourceAddPage {
  tabsPage = TabsPage;
  location = null;

  public formData = {
    type: "room",
    name: "",
    description: ""
  };

  submitted: boolean = false;

  loader: any;

  onSubmit(form) {
    this.submitted = true;
    if (form && form.valid) {
      this.addResource(form);
    }
  }

  addResource(form) {
    this.submitted = true;
    if (form && this.formData.name) {
      let resource = {
        locationId: this.location.locationId,
        name: this.formData.name,
        type: this.formData.type,
        description: this.formData.description
      };
      this.globals.displayLoader("Adding...");
      this.customAuthClient.getClient().resourcesCreate(this.location.locationId, resource).subscribe(
        () => {
          this.globals.dismissLoader();
          this.globals.displayToast(`Resource successfully added.`);
          this.navCtrl.pop();
        },
        (err) => {
          this.globals.dismissLoader();
          this.globals.displayAlert('Error encountered',
            `Attempt to add resource failed. An error occurred. Please check the console logs for more information.`);
          console.log(err);
        }
      );
    }
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, private globals: GlobalStateService, private customAuthClient: CustomAuthorizerClient) {
    this.location = navParams.data.location;
  }

  ionViewDidEnter() {
    Logger.banner("Add a Resource");
  }
}
