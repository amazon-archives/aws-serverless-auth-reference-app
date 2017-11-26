import { Component }          from '@angular/core';
import { NavController }      from 'ionic-angular';
import { GlobalStateService } from '../../services/global-state.service';
import { NavbarComponent } from '../../components/navbar';

@Component({
  selector: 'welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  constructor(public navCtrl: NavController, public globals: GlobalStateService) {

  }
}
