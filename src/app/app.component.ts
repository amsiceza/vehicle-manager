import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  carOutline, carSportOutline, constructOutline, sparklesOutline,
  notificationsOutline, personCircleOutline, addOutline, trashOutline,
  checkmarkCircleOutline, checkmarkOutline, alertCircleOutline, informationCircleOutline,
  chevronForwardOutline, chevronBackOutline, closeOutline, createOutline,
  documentTextOutline, cameraOutline, imageOutline, lockClosedOutline,
  mailOutline, starOutline, star, cloudUploadOutline, speedometerOutline,
  calendarOutline, cashOutline, flameOutline, settingsOutline,
  logOutOutline, shieldCheckmarkOutline, batteryChargingOutline,
  filterOutline, searchOutline, refreshOutline, eyeOutline, eyeOffOutline,
  flashOutline, radioButtonOffOutline, thermometerOutline,
  hammerOutline, sunnyOutline, moonOutline, discOutline,
  waterOutline, waterSharp,
  buildOutline, cogOutline, keyOutline, bicycleOutline,
  colorPaletteOutline, musicalNotesOutline, bluetoothOutline,
  snowOutline, rainyOutline, thunderstormOutline,
  receiptOutline, cardOutline, walletOutline, warningOutline,
  shieldOutline, bulbOutline, diamondOutline, trophyOutline,
  ribbonOutline, rocketOutline, menuOutline,
} from 'ionicons/icons';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    addIcons({
      carOutline, carSportOutline, constructOutline, sparklesOutline,
      notificationsOutline, personCircleOutline, addOutline, trashOutline,
      checkmarkCircleOutline, checkmarkOutline, alertCircleOutline, informationCircleOutline,
      chevronForwardOutline, chevronBackOutline, closeOutline, createOutline,
      documentTextOutline, cameraOutline, imageOutline, lockClosedOutline,
      mailOutline, starOutline, star, cloudUploadOutline, speedometerOutline,
      calendarOutline, cashOutline, flameOutline, settingsOutline,
      logOutOutline, shieldCheckmarkOutline, batteryChargingOutline,
      filterOutline, searchOutline, refreshOutline, eyeOutline, eyeOffOutline,
      flashOutline, radioButtonOffOutline, thermometerOutline,
      hammerOutline, sunnyOutline, moonOutline, discOutline,
      waterOutline,
      buildOutline, cogOutline, keyOutline, bicycleOutline,
      colorPaletteOutline, musicalNotesOutline, bluetoothOutline,
      snowOutline, rainyOutline, thunderstormOutline,
      receiptOutline, cardOutline, walletOutline, warningOutline,
      shieldOutline, bulbOutline, diamondOutline, trophyOutline,
      ribbonOutline, rocketOutline, menuOutline,
      // Aliases for maintenance icons
      'water': waterSharp,
      'disc': discOutline,
      'flash-outline': flashOutline,
      'wrench-outline': constructOutline,
    });
  }
}
