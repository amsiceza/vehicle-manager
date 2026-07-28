import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet],
  template: `
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="vehicles" href="/app/vehicles">
          <ion-icon name="car-outline" />
          <ion-label>Vehículos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="reminders" href="/app/reminders">
          <ion-icon name="notifications-outline" />
          <ion-label>Avisos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/app/profile">
          <ion-icon name="person-circle-outline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {}
