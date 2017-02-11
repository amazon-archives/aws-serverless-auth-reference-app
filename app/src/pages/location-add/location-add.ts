import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { GlobalStateService } from '../../services/global-state.service';
import { CustomAuthorizerClient, IamAuthorizerClient } from "../../services/spacefinder-api.service";
import { Logger } from '../../services/logger.service';


declare const AWS: any;


@Component({
  templateUrl: 'location-add.html',
})

export class LocationAddPage {
  tabsPage = TabsPage;

  public formData = {
    name: "",
    description: "",
    imageUrl: "https://s3.amazonaws.com/spacefinder-public-image-repository/building.png"
  };

  submitted: boolean = false;
  loader: any;

  onSubmit(form) {
    this.submitted = true;
    if (form && form.valid) {
      this.addLocation(form);
    }
  }

  addLocation(form) {
    this.submitted = true;
    if (form && this.formData.name) {
      let location = {
        name: this.formData.name,
        description: this.formData.description,
        imageUrl: this.formData.imageUrl
      };
      this.globals.displayLoader("Adding...");
      this.client.getClient().locationsCreate(location).subscribe(
        (data) => {
          this.globals.dismissLoader();
          this.globals.displayToast(`Location successfully added.`);
          this.navCtrl.pop();
        },
        (err) => {
          this.globals.dismissLoader();
          this.globals.displayAlert('Error encountered',
            `An error occurred when trying to add the location. Please check the console logs for more information.`);
          console.error(err);
        }
      );
    }
  }

  constructor(public navCtrl: NavController, private globals: GlobalStateService, private client: IamAuthorizerClient) {
  }

  ionViewDidEnter() {
    Logger.banner("Add a Location");
  }
}
