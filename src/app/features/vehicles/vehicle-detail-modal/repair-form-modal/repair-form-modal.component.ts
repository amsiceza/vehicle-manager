import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonInput, IonTextarea, IonToggle, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { RepairLog } from '../../../../core/models/repair-log.model';
import { IconPickerComponent } from '../../../../shared/components/icon-picker/icon-picker.component';

const ICON_INSURANCE = 'shield-checkmark-outline';
const ICON_NO_INSURANCE = 'hammer-outline';

@Component({
  selector: 'app-repair-form-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
    IonInput, IonTextarea, IonToggle, IonSpinner,
    IconPickerComponent,
  ],
  templateUrl: './repair-form-modal.component.html',
  styleUrls: ['./repair-form-modal.component.scss'],
})
export class RepairFormModalComponent implements OnInit {
  @Input() vehicleId!: string;
  @Input() repair?: RepairLog;

  private readonly fs = inject(FirestoreService);
  private readonly modalCtrl = inject(ModalController);

  readonly isEdit = signal(false);

  readonly description = signal('');
  readonly workshop = signal('');
  readonly date = signal(this.toInputDate(new Date()));
  readonly mileage = signal(0);
  readonly cost = signal(0);
  readonly isInsuranceClaim = signal(false);
  readonly notes = signal('');
  readonly icon = signal(ICON_NO_INSURANCE);

  readonly loading = signal(false);
  readonly error = signal('');

  private iconTouched = false;

  ngOnInit(): void {
    if (this.repair) {
      this.isEdit.set(true);
      this.description.set(this.repair.description);
      this.workshop.set(this.repair.workshop);
      this.date.set(this.toInputDate(this.repair.date));
      this.mileage.set(this.repair.mileage);
      this.cost.set(this.repair.cost);
      this.isInsuranceClaim.set(this.repair.isInsuranceClaim);
      this.notes.set(this.repair.notes);
      this.icon.set(this.repair.icon ?? (this.repair.isInsuranceClaim ? ICON_INSURANCE : ICON_NO_INSURANCE));
      this.iconTouched = !!this.repair.icon;
    }
  }

  onInsuranceChange(value: boolean): void {
    this.isInsuranceClaim.set(value);
    if (!this.iconTouched) this.icon.set(value ? ICON_INSURANCE : ICON_NO_INSURANCE);
  }

  onIconChange(icon: string): void {
    this.icon.set(icon);
    this.iconTouched = true;
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  async save(): Promise<void> {
    if (!this.description().trim() || !this.workshop().trim() || !this.date() || this.cost() < 0) {
      this.error.set('Rellena descripción, taller, fecha y coste.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const built: RepairLog = {
        id: this.repair?.id ?? crypto.randomUUID(),
        vehicleId: this.vehicleId,
        date: new Date(this.date()),
        mileage: this.mileage(),
        description: this.description().trim(),
        workshop: this.workshop().trim(),
        cost: this.cost(),
        isInsuranceClaim: this.isInsuranceClaim(),
        notes: this.notes().trim(),
        createdAt: this.repair?.createdAt ?? new Date(),
        icon: this.icon(),
      };

      if (this.isEdit()) {
        await this.fs.updateRepairLog(built);
      } else {
        await this.fs.saveRepairLog(built);
      }
      await this.modalCtrl.dismiss(built, 'save');
    } catch {
      this.error.set('Error al guardar la reparación.');
    } finally {
      this.loading.set(false);
    }
  }

  private toInputDate(d: Date): string {
    return (d instanceof Date ? d : new Date(d)).toISOString().substring(0, 10);
  }
}
