import { Component, Output, EventEmitter } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { FREE_VEHICLE_LIMIT } from '../../../core/models/user.model';

@Component({
  selector: 'app-paywall',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './paywall.component.html',
  styleUrls: ['./paywall.component.scss'],
})
export class PaywallComponent {
  @Output() close = new EventEmitter<void>();

  readonly limit = FREE_VEHICLE_LIMIT;

  readonly features = [
    { icon: 'car-outline', title: 'Vehículos ilimitados', desc: `Sin límite de ${FREE_VEHICLE_LIMIT}` },
    { icon: 'document-text-outline', title: 'Exportar a PDF', desc: 'Informes completos' },
    { icon: 'cloud-upload-outline', title: 'Nube ilimitada', desc: 'Fotos y adjuntos sin límite' },
    { icon: 'notifications-outline', title: 'Recordatorios Pro', desc: 'Alertas por km y fecha' },
  ];
}
