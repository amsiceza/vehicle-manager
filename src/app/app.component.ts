import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  carOutline, carSportOutline, constructOutline, sparklesOutline,
  notificationsOutline, personCircleOutline, addOutline, trashOutline,
  checkmarkCircleOutline, alertCircleOutline, informationCircleOutline,
  chevronForwardOutline, chevronBackOutline, closeOutline, createOutline,
  documentTextOutline, cameraOutline, imageOutline, lockClosedOutline,
  mailOutline, starOutline, star, cloudUploadOutline, speedometerOutline,
  calendarOutline, cashOutline, flameOutline, settingsOutline,
  logOutOutline, shieldCheckmarkOutline, batteryChargingOutline,
  filterOutline, searchOutline, refreshOutline, eyeOutline,
  flashOutline, radioButtonOffOutline, thermometerOutline,
  hammerOutline, sunnyOutline, moonOutline, discOutline,
  waterOutline, waterSharp,
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
      checkmarkCircleOutline, alertCircleOutline, informationCircleOutline,
      chevronForwardOutline, chevronBackOutline, closeOutline, createOutline,
      documentTextOutline, cameraOutline, imageOutline, lockClosedOutline,
      mailOutline, starOutline, star, cloudUploadOutline, speedometerOutline,
      calendarOutline, cashOutline, flameOutline, settingsOutline,
      logOutOutline, shieldCheckmarkOutline, batteryChargingOutline,
      filterOutline, searchOutline, refreshOutline, eyeOutline,
      flashOutline, radioButtonOffOutline, thermometerOutline,
      hammerOutline, sunnyOutline, moonOutline, discOutline,
      waterOutline,
      // Aliases for maintenance icons
      'water': waterSharp,
      'disc': discOutline,
      'flash-outline': flashOutline,
      'wrench-outline': constructOutline,
    });
  }
}
