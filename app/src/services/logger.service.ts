import { Injectable } from '@angular/core';
import { Config } from '../config/config'

@Injectable()
export class Logger {

  // For more formatting options:
  // https://developers.google.com/web/tools/chrome-devtools/console/console-reference?utm_source=dcc&utm_medium=redirect&utm_campaign=2016q3#dir

  public static LeadInStyle = 'font-weight:bold; color:green';

  public static banner(text): void {
    console.log(`%c  ${text}  `, "color: white; font-size:15px; background-color: #666666; width: 100%");
  }

  public static heading(text): void {
    console.log(`%c  ${text}  `, "color: white; color: #666666; background-color: #F2F2F2; width: 100%");
  }

}