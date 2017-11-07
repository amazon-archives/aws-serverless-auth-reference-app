import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { AccountSigninPage } from '../account-signin/account-signin';
import { UserLoginService } from "../../services/account-management.service";
import { Booking } from "../../services/spacefinder-sdk/model/Booking";
import { AccountSignupPage } from '../account-signup/account-signup';
import { IamAuthorizerClient } from "../../services/spacefinder-api.service";
import { Logger } from '../../services/logger.service';
import { CognitoUtil, UserState } from '../../services/account-management.service';

@Component({
  templateUrl: 'bookings.html',
})
export class BookingsPage {
  initialized = false;
  accountSigninPage = AccountSigninPage;
  accountSignupPage = AccountSignupPage;
  bookings: Booking[] = [];
  data: any = [];


  displayCancelDialog(bookingId, timeslotDisplayText, locationName, resourceName) {
    console.log("Cancelling bookingId " + bookingId);

    let dialog = this.globals.getAlertController().create({
      title: 'Cancel booking?',
      message: `Are you sure you want to cancel the <b>${resourceName}</b> booking (at <b>${locationName}</b>), for the <b>${timeslotDisplayText}</b> timeslot?`,
      buttons: [
        {
          text: 'No',
          handler: () => { }
        },
        {
          text: 'Yes, cancel the booking',
          handler: () => {
            this.cancelBooking(bookingId)
            .then(() => {
              this.globals.dismissLoader();
              this.globals.displayToast(`Booking was successfully cancelled.`);
            })
            .catch((err) => {
              this.globals.dismissLoader();
              this.globals.displayAlert('Error encountered',
                `Cancellation attempt failed. Please check the console logs for more information.`);
              console.log(err);
            });
          }
        }
      ]
    });
    dialog.present();
  }

  cancelBooking(bookingId): Promise<void> {
    let promise: Promise<void> = new Promise<void>((resolve, reject) => {

      // delete from the database
      this.globals.displayLoader("Cancelling...");
      this.authClient.getClient().bookingsDelete(this.globals.getUserId(), bookingId).subscribe(
        (data) => {
          // after the database has been successfully updated, then
          // remove any in-memory references to the booking as well.
          // first, remove the item from the resources array
          let data2 = [];
          let index = this.bookings.findIndex( booking => { return booking.bookingId == bookingId});
          if (index > -1) {
            this.bookings.splice(index, 1);
            // also remove any references from the data array
            for (let d of this.data) {
              let index = d.bookings.findIndex( booking => { return booking.bookingId == bookingId});
              if (index > -1) {
                d.bookings.splice(index, 1);
              }
              // do bookings still remain? if so, then let's add it to our new data2 array
              if (d.bookings.length > 0) {
                data2.push({
                  "date": d.date,
                  "bookings": d.bookings
                });
              }
            }
            // swap the old data array with our newer data2 array
            this.data = data2;
          }
          resolve();
        },
        (err) => {
          reject(err);
        }
      );
    });
    return promise;
  }

  // note: this modifies the bookings array in place
  generateDataHashFromBookings(bookings: Booking[]) {
    if (bookings.length == 0) {
      return [];
    }
    let result = [];

    // Here's what the desired data structure looks like
    /*
    this.data = [
      {
        "date": "Friday, June 7, 2016",
        "bookings": [this.bookings[0], this.bookings[1]]
      },
      {
        "date": "Friday, June 9, 2016",
        "bookings": [this.bookings[2]]
      },
    ];
    */

    // first, sort all the bookings by time
    bookings.sort((a, b) => {
      return a.startTimeEpochTime - b.startTimeEpochTime;
    });

    // now, populate the desired data structure.
    // The bookings are already in sorted order.
    // if the current booking has the same date as the prior one,
    // then add it to the same array. Otherwise, create a new array
    // each time a new date is encountered.
    let currentDateString = null;
    let bookingsSoFar = [];
    // bookings.push({locationId: null, resourceId: null, userId: null, startTimeEpochTime: 0});

    for (let i=0; i<bookings.length; i++) {
      let booking = bookings[i];
      let date = new Date(booking.startTimeEpochTime);
      let dateString = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
      if (dateString === currentDateString) {
        bookingsSoFar.push(booking);
      } else {
        // store the bookings seen so far...
        if (bookingsSoFar.length > 0) {
          let b = {
            "date": currentDateString,
            "bookings": bookingsSoFar.slice(0) // clone the array
          };
          result.push(b);
        }
        // ...and start with a fresh array
        currentDateString = dateString;
        bookingsSoFar = [booking];
      }
    }
    if (bookingsSoFar.length > 0) {
      let b = {
        "date": currentDateString,
        "bookings": bookingsSoFar.slice(0) // clone the array
      };
      result.push(b);
    }
    return result;
  }

  loadBookings(userId): void {
    this.authClient.getClient().bookingsListByUserId(userId).subscribe(
      (data) => {
        this.bookings = data.items;
        this.data = this.generateDataHashFromBookings(this.bookings);
        this.globals.dismissLoader();
        this.initialized = true;
      },
      (err) => {
        this.globals.dismissLoader();
        this.globals.displayAlert('Error encountered', 'Unable to load bookings. Please check the console logs for more information.');
        this.initialized = true;
        console.error(err);
      }
    );
  };

  constructor(public navCtrl: NavController,  public globals: GlobalStateService, private authClient: IamAuthorizerClient) {
    // empty
  }

  ionViewDidEnter() {
    Logger.banner("My Bookings");
    this.data = [];
    if (!this.initialized) {

      if (this.globals.userId != '' && CognitoUtil.getUserState() == UserState.SignedIn && UserLoginService.getAwsAccessKey() != null) {
        this.initialized = false;
        UserLoginService.getAwsCredentials()
        .then(() => {
          this.globals.displayLoader("Loading...");
          this.loadBookings(this.globals.getUserId());
        })
        .catch((err) => {
          this.globals.displayAlert('Error encountered', 'Unable to load bookings. Please check the console logs for more information.');
          console.log("ERROR: Unable to load bookings!");
          console.log(err)
        })
      } else {
        this.initialized = true;
      }
    }
  }

  ionViewDidLeave() {
    this.initialized = false;
    this.data = [];
  }
}
