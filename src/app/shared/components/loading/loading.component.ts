import { Component, Input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <div class="loading-wrap">
      <ion-spinner name="crescent" />
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; height: 60vh;
      ion-spinner { --color: var(--ion-color-primary); width: 40px; height: 40px; }
      p { color: var(--lg-text-2); font-size: 14px; margin: 0; }
    }
  `],
})
export class LoadingComponent {
  @Input() message = 'Cargando…';
}
