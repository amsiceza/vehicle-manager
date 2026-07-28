import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [IonIcon, DecimalPipe],
  template: `
    <div class="vehicle-card">
      <div class="vehicle-photo">
        @if (vehicle.photoURLs[0]) {
          <img [src]="vehicle.photoURLs[0]" [alt]="name" loading="lazy" />
        } @else {
          <ion-icon name="car-sport-outline" />
        }
      </div>
      <div class="vehicle-info">
        <div class="vehicle-name">{{ name }}</div>
        <div class="vehicle-meta">
          <ion-icon name="car-outline" />{{ vehicle.licensePlate }}
          <ion-icon name="speedometer-outline" />{{ vehicle.currentMileage | number }} km
        </div>
      </div>
    </div>
  `,
})
export class VehicleCardComponent {
  @Input({ required: true }) vehicle!: Vehicle;

  get name(): string { return vehicleDisplayName(this.vehicle); }
}
