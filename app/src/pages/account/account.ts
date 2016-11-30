import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AccountSigninPage } from '../account-signin/account-signin';
import { AccountSignupPage } from '../account-signup/account-signup';
import { AccountChangePasswordPage } from '../account-change-password/account-change-password';
import { LocationAddPage } from '../location-add/location-add';
import { GlobalStateService } from '../../services/global-state.service';
import { ImagePicker } from 'ionic-native';
import { UserLoginService } from '../../services/account-management.service';
import { Config } from '../../config/config'
import { Logger } from '../../services/logger.service';
import { Platform } from 'ionic-angular';
declare const AWS: any;

@Component({
  templateUrl: 'account.html',
})
export class AccountPage {

  viewAdminFeatures = false;
  platform : Platform;
  accountSigninPage = AccountSigninPage;
  accountSignupPage = AccountSignupPage;
  accountChangePasswordPage = AccountChangePasswordPage;
  locationAddPage = LocationAddPage;

  imageUploadEventListenerAttached = false;
  profileImageURI = `https://s3-${Config.REGION}.amazonaws.com/${Config.PROFILE_IMAGES_S3_BUCKET}/test.jpg`;
  profileImageDisplay = false;
  submitted: boolean = false;

  setViewAdmin(event) {
    // console.log(this.viewAdminFeatures);
    this.globals.setViewAdminFeaturesOverride(this.viewAdminFeatures);
  }
  // code from: http://stackoverflow.com/questions/29644474/how-to-be-able-to-convert-image-to-base64-and-avoid-same-origin-policy
  convertImgToBase64URL(url, callback, outputFormat) {
    let img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      let canvas = document.createElement('CANVAS');
      let cvs = (<any>canvas);
      let ctx = cvs.getContext('2d');
      cvs.height = this.height;
      cvs.width = this.width;
      ctx.drawImage(this, 0, 0);
      let dataURL = cvs.toDataURL(outputFormat);
      callback(dataURL);
      canvas = null;
    };
    img.src = url;
    return url;
  }

  dataURItoBlob(dataURI) {
    // code adapted from: http://stackoverflow.com/questions/33486352/cant-upload-image-to-aws-s3-from-ionic-camera
    let binary = atob(dataURI.split(',')[1]);
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
  };

  generateHash(str) {
    // code adapted from: https://github.com/darkskyapp/string-hash
    let hash = 5381, i = str.length
    while (i) {
      hash = (hash * 33) ^ str.charCodeAt(--i)
    }
    return hash >>> 0;
  }

  uploadFileToS3(file, key) {
    Logger.heading('Uploading image to S3');
    this.globals.displayLoader('Uploading image to Amazon S3...', 10000);
    let bucketName = Config.PROFILE_IMAGES_S3_BUCKET;
    console.log(`Attempting image upload to ${bucketName}/${key}`);
    let s3bucket = new AWS.S3({region: Config.REGION, params: {Bucket: bucketName}});
    let params = {Key: key, Body: file};
    s3bucket.upload(params, (err, data)=> {
      this.globals.dismissLoader();
      if (err) {
        let errorMessage = `Error uploading image to S3: ${err}`
        this.globals.displayAlert('Error encountered', errorMessage);
        console.log(errorMessage);
        console.log(err);
      } else {
        console.log(`Successfully uploaded image to S3.`);
        this.profileImageURI = `https://s3.amazonaws.com/${Config.PROFILE_IMAGES_S3_BUCKET}/${key}`;
        console.log(`Image can be viewed at: ${this.profileImageURI}`)
        this.profileImageDisplay = true;
      }
    });
  }

  selectImage() {
    // display a different FileSelector experience,
    // depending on whether the app is running on a mobile phone or a web browser
    if (this.platform.is('cordova')) {
      this.selectImageUsingNativeImageSelector();
    } else {
      this.selectImageUsingBrowserFileSelector();
    }
  }

  selectImageUsingBrowserFileSelector() {
    let selectedFiles : any = document.getElementById('imageUpload');
    let files = selectedFiles.files;
    if (selectedFiles.value !== '' && files.length > 0) {
      let filename = this.generateUniqueFilenameForS3Upload(files[0].name);
      this.uploadFileToS3(files[0], filename);
    } else {
      this.globals.dismissLoader();
      let errorMessage = 'Please select an image to upload first.';
      this.globals.displayAlert('Error encountered', errorMessage);
      console.log(errorMessage);
    }
    // reset the file selector UI
    let imageUploadFormSubmit : any = document.getElementById('imageUploadSubmit');
    imageUploadFormSubmit.style.visibility = 'hidden';
  }

  generateUniqueFilenameForS3Upload(originalFilename) : string {
    console.log(originalFilename);
    return `${this.globals.getUnencodedUserId()}/${this.generateHash(originalFilename)}-${(new Date()).getTime()}.${originalFilename.split('.').pop()}`;
  }
  selectImageUsingNativeImageSelector() {
    Logger.heading('Displaying ImageSelector');
    // this.profileImageURI = 'https://s3-${Config.PROFILE_IMAGES_S3_BUCKET_REGION}.amazonaws.com/${Config.PROFILE_IMAGES_S3_BUCKET}/test.jpg'; // TODO
    try {
      let options = {
        maximumImagesCount: 1,
        width: 200,
        height: 200,
        quality: 100
      }
      // code adapted from: http://blog.ionic.io/ionic-native-accessing-ios-photos-and-android-gallery-part-2/
      ImagePicker.getPictures(options)
      .then(
        file_uris => {
          try {
            if (file_uris !== null && file_uris !== '' && (file_uris.length > 0)) {
              console.log(`Image selected: [${file_uris}]`);
              console.log(`Converting to Base64 image`);
              this.convertImgToBase64URL(file_uris[0], base64Img=>{
                // console.log(base64Img);
                console.log('Converting to Blob');
                let blob = this.dataURItoBlob(base64Img);
                // generate a unique filename
                let filename = this.generateUniqueFilenameForS3Upload(file_uris[0]);
                this.uploadFileToS3(blob, filename);
              }, null);
            }
          } catch (err) {
            throw(err);
          }
        },
        err => {
          throw err;
        }
      );
    } catch (err) {
      this.globals.dismissLoader();
      let errorMessage = 'Could not retrieve an image using the ImagePicker';
      this.globals.displayAlert('Error encountered', errorMessage);
      console.log(errorMessage);
      console.log(err);
    }
  }

  attachImageUploadEventListener() {
    if (this.platform.is('cordova')) {
      // Check If Cordova/Mobile. If it's mobile, then exit,
      // since this feature only applies to the Web experience, not mobile.
      // This event listener is a browser UI workaround, so that
      // we don't have to use the browser's standard, non-attractive FileSelector control
      return;
    }
    // check if the eventListener was already previously attached
    if (this.imageUploadEventListenerAttached) {
      return;
    }
    // console.log("Attaching event listener...");
    let imageUploadFormField : any = document.getElementById('imageUpload');
    let imageUploadFormSubmit : any = document.getElementById('imageUploadSubmit');

    // try again later if the DOM isn't fully ready yet
    if (imageUploadFormField == null) {
      return;
    }
    this.imageUploadEventListenerAttached = true;
    imageUploadFormField.addEventListener('change', function( e ) {
      let fileName = e.target.value.split( '\\' ).pop();
      if (fileName === null || fileName === '') {
        // reset the file selector UI
        let imageUploadFormSubmit : any = document.getElementById('imageUploadSubmit');
        imageUploadFormSubmit.style.visibility = 'hidden';
      } else {
        // select your implementation approach (show upload button or not?)
        let showUploadButton = false;
        if (showUploadButton) {
          imageUploadFormSubmit.querySelector('span').innerHTML = `UPLOAD (${fileName})`;
          imageUploadFormSubmit.style.visibility = 'visible';
        } else {
          // simulate the Upload button being selected
          var evObj = document.createEvent('Events');
          evObj.initEvent('click', true, false);
          imageUploadFormSubmit.dispatchEvent(evObj)
        }
      }
    });
  }

  constructor(private navCtrl: NavController, public globals: GlobalStateService, platform: Platform) {
    this.platform = platform
  }

  ionViewDidEnter() {
    Logger.banner("Account");
    this.attachImageUploadEventListener();
    this.viewAdminFeatures = this.globals.getViewAdminFeaturesOverride();
  }
}
