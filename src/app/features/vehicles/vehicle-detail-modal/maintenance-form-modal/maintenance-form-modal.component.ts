import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonInput, IonTextarea, IonSelect, IonSelectOption, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { MaintenanceLog, MaintenanceType, MAINTENANCE_TYPES, MAINTENANCE_ICONS } from '../../../../core/models/maintenance-log.model';
import { IconPickerComponent } from '../../../../shared/components/icon-picker/icon-picker.component';

@Component({
  selector: 'app-maintenance-form-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonSpinner,
    IconPickerComponent,
  ],
  templateUrl: './maintenance-form-modal.component.html',
  styleUrls: ['./maintenance-form-modal.component.scss'],
})
export class MaintenanceFormModalComponent implements OnInit {
  @Input() vehicleId!: string;
  @Input() log?: MaintenanceLog;

  private readonly fs = inject(FirestoreService);
  private readonly modalCtrl = inject(ModalController);

  readonly types = MAINTENANCE_TYPES;
  readonly isEdit = signal(false);

  readonly type = signal<MaintenanceType>('Aceite');
  readonly date = signal(this.toInputDate(new Date()));
  readonly mileage = signal(0);
  readonly cost = signal(0);
  readonly notes = signal('');
  readonly icon = signal(MAINTENANCE_ICONS['Aceite']);

  readonly loading = signal(false);
  readonly error = signal('');

  private iconTouched = false;

  ngOnInit(): void {
    if (this.log) {
      this.isEdit.set(true);
      this.type.set(this.log.type);
      this.date.set(this.toInputDate(this.log.date));
      this.mileage.set(this.log.mileage);
      this.cost.set(this.log.cost);
      this.notes.set(this.log.notes);
      this.icon.set(this.log.icon ?? MAINTENANCE_ICONS[this.log.type]);
      this.iconTouched = !!this.log.icon;
    }
  }

  onTypeChange(type: MaintenanceType): void {
    this.type.set(type);
    if (!this.iconTouched) this.icon.set(MAINTENANCE_ICONS[type]);
  }

  onIconChange(icon: string): void {
    this.icon.set(icon);
    this.iconTouched = true;
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  async save(): Promise<void> {
    if (!this.date() || this.mileage() < 0 || this.cost() < 0) {
      this.error.set('Revisa los campos: fecha, km y coste.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const built: MaintenanceLog = {
        id: this.log?.id ?? crypto.randomUUID(),
        vehicleId: this.vehicleId,
        date: new Date(this.date()),
        mileage: this.mileage(),
        type: this.type(),
        cost: this.cost(),
        notes: this.notes().trim(),
        attachmentURLs: this.log?.attachmentURLs ?? [],
        icon: this.icon(),
      };

      if (this.isEdit()) {
        await this.fs.updateMaintenanceLog(built);
      } else {
        await this.fs.saveMaintenanceLog(built);
      }
      await this.modalCtrl.dismiss(built, 'save');
    } catch {
      this.error.set('Error al guardar el mantenimiento.');
    } finally {
      this.loading.set(false);
    }
  }

  private toInputDate(d: Date): string {
    return (d instanceof Date ? d : new Date(d)).toISOString().substring(0, 10);
  }
}
