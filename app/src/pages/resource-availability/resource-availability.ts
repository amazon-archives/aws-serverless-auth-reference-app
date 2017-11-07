import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {GlobalStateService} from '../../services/global-state.service';
import {AccountSigninPage} from '../account-signin/account-signin';
import {UserLoginService} from "../../services/account-management.service";
import {Booking} from "../../services/spacefinder-sdk/model/Booking";
import {IamAuthorizerClient} from "../../services/spacefinder-api.service";
import {Logger} from '../../services/logger.service';

@Component({
  templateUrl: 'resource-availability.html',
})
export class ResourceAvailabilityPage {

  initialized = false;
  accountSigninPage = AccountSigninPage;
  location = null;
  resource = null;
  date: string;
  todaydate: string;
  bookings: Booking[] = [];


  availableTimeslots = [
    "6am - 7am",
    "7am - 8am",
    "8am - 9am",
    "9am - 10am",
    "10am - 11am",
    "11am - noon",
    "noon - 1pm",
    "1pm - 2pm",
    "2pm - 3pm",
    "3pm - 4pm",
    "4pm - 5pm",
    "5pm - 6pm",
    "6pm - 7pm",
    "7pm - 8pm",
    "8pm - 9pm",
  ]

  timeslotMappings = {
    "6am - 7am": {start: "T06:00:00.000Z", end: "T07:00:00.000Z"},
    "7am - 8am": {start: "T07:00:00.000Z", end: "T08:00:00.000Z"},
    "8am - 9am": {start: "T08:00:00.000Z", end: "T09:00:00.000Z"},
    "9am - 10am": {start: "T09:00:00.000Z", end: "T10:00:00.000Z"},
    "10am - 11am": {start: "T10:00:00.000Z", end: "T11:00:00.000Z"},
    "11am - noon": {start: "T11:00:00.000Z", end: "T12:00:00.000Z"},
    "noon - 1pm": {start: "T12:00:00.000Z", end: "T13:00:00.000Z"},
    "1pm - 2pm": {start: "T13:00:00.000Z", end: "T14:00:00.000Z"},
    "2pm - 3pm": {start: "T14:00:00.000Z", end: "T15:00:00.000Z"},
    "3pm - 4pm": {start: "T15:00:00.000Z", end: "T16:00:00.000Z"},
    "4pm - 5pm": {start: "T16:00:00.000Z", end: "T17:00:00.000Z"},
    "5pm - 6pm": {start: "T17:00:00.000Z", end: "T18:00:00.000Z"},
    "6pm - 7pm": {start: "T18:00:00.000Z", end: "T19:00:00.000Z"},
    "7pm - 8pm": {start: "T19:00:00.000Z", end: "T20:00:00.000Z"},
    "8pm - 9pm": {start: "T20:00:00.000Z", end: "T21:00:00.000Z"},
  }

  getBooking(timeslot) {
    // Date string manipulation to calculate the startTime that we'll match on
    let date = new Date(Date.parse(this.date));
    let datestamp = "" + date.getUTCFullYear() + "-" + (date.getUTCMonth() < 10 ? "0" : "") + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate();
    let startTimeIsoTimestamp = datestamp + this.timeslotMappings[timeslot].start;
    let startTimeEpochTime = new Date(startTimeIsoTimestamp).getTime();

    // find the booking that matches that start time
    let index = this.bookings.findIndex(booking => {
      return booking.startTimeEpochTime === startTimeEpochTime
    });
    if (index > -1) {
      return this.bookings[index];
    } else {
      return null;
    }
  }

  displayBookingDialog(resourceId, timeslot) {
    let dialog = this.globals.getAlertController().create({
      title: 'Book resource?',
      message: `Are you sure you want to book the [<b>${timeslot}</b>] time slot?`,
      buttons: [
        {
          text: 'Cancel',
          handler: () => { /* do nothing */
          }
        },
        {
          text: 'OK',
          handler: () => {
            this.bookResource(resourceId, timeslot)
              .then(() => {
                this.globals.dismissLoader();
                this.globals.displayToast(`[${timeslot}] was successfully booked.`);
              })
              .catch((err) => {
                this.globals.dismissLoader();
                this.globals.displayAlert('Error encountered',
                  'Booking attempt failed. Please check the console logs for more information.');
                console.error(err);
              });
          }
        }
      ]
    });
    dialog.present();
  }

  changeDate(date) {
    this.globals.displayLoader("Loading...");
    this.loadBookings(this.location.locationId, this.resource.resourceId);
  }

  bookResource(resourceId, timeslot): Promise<void> {
    let promise: Promise<void> = new Promise<void>((resolve, reject) => {
      this.globals.displayLoader("Booking...");

      // Date string manipulation to calculate the startTime and endTime values, based on the timeslot. All dates are UTC.
      let date = new Date(Date.parse(this.date));
      let datestamp = "" + date.getUTCFullYear() + "-" + (date.getUTCMonth() < 9 ? "0" : "") + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate()
      let startTimeIsoTimestamp = datestamp + this.timeslotMappings[timeslot].start;
      let endTimeIsoTimestamp = datestamp + this.timeslotMappings[timeslot].end;

      let booking: Booking = {
        locationId: this.location.locationId,
        locationName: this.location.name,
        resourceId: this.resource.resourceId,
        resourceName: this.resource.name,
        resourceDescription: this.resource.description,
        startTimeIsoTimestamp: startTimeIsoTimestamp,
        startTimeEpochTime: Date.parse(startTimeIsoTimestamp),
        endTimeIsoTimestamp: endTimeIsoTimestamp,
        endTimeEpochTime: Date.parse(endTimeIsoTimestamp),
        timeslot: timeslot,
        userId: this.globals.getUserId(),
        userFirstName: this.globals.getUserFirstName(),
        userLastName: this.globals.getUserLastName(),
      };
      this.authClient.getClient().bookingsCreate(this.globals.getUserId(), booking).subscribe(
        (data) => {
          booking.bookingId = data.bookingId;
          this.bookings.push(booking);
          resolve();
        },
        (err) => {
          reject(err);
        }
      );
    });
    return promise;
  }

  displayCancelDialog(timeslot) {
    let bookingId = this.getBooking(timeslot).bookingId;
    console.log("Cancelling bookingId " + bookingId);

    let dialog = this.globals.getAlertController().create({
      title: 'Cancel booking?',
      message: `Are you sure you want to cancel the booking for <b>${timeslot}</b>?`,
      buttons: [
        {
          text: 'No',
        },
        {
          text: 'Yes, cancel the booking',
          handler: () => {
            this.cancelBooking(bookingId)
              .then(() => {
                this.globals.dismissLoader();
                this.globals.displayToast(`[${timeslot}] booking was successfully cancelled.`);
              })
              .catch((err) => {
                this.globals.dismissLoader();
                this.globals.displayAlert('Error encountered',
                  `Cancellation attempt failed. Please check the console logs for more information.`);
                console.error(err);
              });
          }
        }
      ]
    });
    dialog.present();
  }

  cancelBooking(bookingId): Promise<void> {
    let promise: Promise<void> = new Promise<void>((resolve, reject) => {

      this.globals.displayLoader("Cancelling...");
      this.authClient.getClient().bookingsDelete(this.globals.getUserId(), bookingId).subscribe(
        (data) => {
          // remove the item from the in-memory array
          let index = this.bookings.findIndex(booking => {
            return booking.bookingId == bookingId
          });
          if (index > -1) {
            this.bookings.splice(index, 1);
            resolve();
          } else {
            let err = "Could not retrieve the booking info.";
            reject(err);
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
    return promise;
  }

  loadBookings(locationId, resourceId): void {
    this.authClient.getClient().bookingsListByResourceId(locationId, resourceId).subscribe(
      (data) => {
        this.bookings = data.items;
        this.globals.dismissLoader();
        this.initialized = true;
      },
      (err) => {
        console.error(err);
      }
    );
  };

  constructor(public navCtrl: NavController, public navParams: NavParams, public globals: GlobalStateService, private authClient: IamAuthorizerClient) {
    this.location = navParams.data.location;
    this.resource = navParams.data.resource;
    this.date = (new Date()).toISOString();
    this.todaydate = (new Date()).toISOString();
  }

  ionViewDidEnter() {
    Logger.banner("Resource Availability");
    this.initialized = true;
    if (UserLoginService.getAwsAccessKey() != null) {
      this.initialized = false;
      UserLoginService.getAwsCredentials()
        .then(() => {
          this.globals.displayLoader("Loading...");
          this.loadBookings(this.location.locationId, this.resource.resourceId); // TODO
        })
        .catch((err) => {
          console.log("ERROR: Unable to load bookings!");
          console.log(err)
        })
    }
  }

  ionViewDidLeave() {
    this.initialized = false;
    this.bookings = [];
  }
}
