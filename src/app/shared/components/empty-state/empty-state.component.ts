import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  template: `
    <div class="empty-wrap">
      <div class="empty-icon-bg">
        <ion-icon [name]="icon" />
      </div>
      <h3>{{ title }}</h3>
      <p>{{ subtitle }}</p>
      @if (actionLabel) {
        <ion-button fill="outline" (click)="action.emit()">{{ actionLabel }}</ion-button>
      }
    </div>
  `,
  styles: [`
    .empty-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 48px 32px; gap: 12px; min-height: 50vh;
    }
    .empty-icon-bg {
      width: 80px; height: 80px;
      background: var(--lg-bg-md);
      border: 1px solid var(--lg-border);
      border-radius: var(--lg-r-xl);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
      ion-icon { font-size: 36px; color: var(--lg-text-2); }
    }
    h3 { font-size: 18px; font-weight: 700; color: var(--lg-text); margin: 0; }
    p  { font-size: 14px; color: var(--lg-text-2); margin: 0; max-width: 280px; line-height: 1.5; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'information-circle-outline';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
