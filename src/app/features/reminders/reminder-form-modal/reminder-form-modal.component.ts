import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonInput, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Reminder } from '../../../core/models/reminder.model';

@Component({
  selector: 'app-reminder-form-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
    IonInput, IonSpinner,
  ],
  templateUrl: './reminder-form-modal.component.html',
  styleUrls: ['./reminder-form-modal.component.scss'],
})
export class ReminderFormModalComponent implements OnInit {
  @Input() vehicleId!: string;
  @Input() reminder?: Reminder;
  @Input() prefillTitle?: string;

  private readonly fs = inject(FirestoreService);
  private readonly modalCtrl = inject(ModalController);

  readonly isEdit = signal(false);

  readonly title = signal('');
  readonly dueDate = signal('');
  readonly dueMileage = signal<number | null>(null);

  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    if (this.reminder) {
      this.isEdit.set(true);
      this.title.set(this.reminder.title);
      this.dueDate.set(this.reminder.dueDate ? this.toInputDate(this.reminder.dueDate) : '');
      this.dueMileage.set(this.reminder.dueMileage ?? null);
    } else if (this.prefillTitle) {
      this.title.set(this.prefillTitle);
    }
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  async save(): Promise<void> {
    if (!this.title().trim()) {
      this.error.set('Escribe un título para el aviso.');
      return;
    }
    if (!this.dueDate() && this.dueMileage() === null) {
      this.error.set('Indica una fecha o un kilometraje.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const built: Reminder = {
        id: this.reminder?.id ?? crypto.randomUUID(),
        vehicleId: this.vehicleId,
        title: this.title().trim(),
        dueDate: this.dueDate() ? new Date(this.dueDate()) : undefined,
        dueMileage: this.dueMileage() ?? undefined,
        isTriggered: this.reminder?.isTriggered ?? false,
        createdAt: this.reminder?.createdAt ?? new Date(),
      };

      if (this.isEdit()) {
        await this.fs.updateReminder(built);
      } else {
        await this.fs.saveReminder(built);
      }
      await this.modalCtrl.dismiss(built, 'save');
    } catch {
      this.error.set('Error al guardar el aviso.');
    } finally {
      this.loading.set(false);
    }
  }

  private toInputDate(d: Date): string {
    return (d instanceof Date ? d : new Date(d)).toISOString().substring(0, 10);
  }
}
