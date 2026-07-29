import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonInput, IonTextarea, IonSelect, IonSelectOption, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { ModificationLog, MODIFICATION_CATEGORIES, DEFAULT_MODIFICATION_ICON } from '../../../../core/models/modification-log.model';
import { IconPickerComponent } from '../../../../shared/components/icon-picker/icon-picker.component';

@Component({
  selector: 'app-modification-form-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonSpinner,
    IconPickerComponent,
  ],
  templateUrl: './modification-form-modal.component.html',
  styleUrls: ['./modification-form-modal.component.scss'],
})
export class ModificationFormModalComponent implements OnInit {
  @Input() vehicleId!: string;
  @Input() mod?: ModificationLog;

  private readonly fs = inject(FirestoreService);
  private readonly modalCtrl = inject(ModalController);

  readonly categories = MODIFICATION_CATEGORIES;
  readonly isEdit = signal(false);

  readonly category = signal(this.categories[0]);
  readonly partName = signal('');
  readonly brand = signal('');
  readonly cost = signal(0);
  readonly notes = signal('');
  readonly icon = signal(DEFAULT_MODIFICATION_ICON);

  readonly loading = signal(false);
  readonly error = signal('');

  private iconTouched = false;

  ngOnInit(): void {
    if (this.mod) {
      this.isEdit.set(true);
      this.category.set(this.mod.category);
      this.partName.set(this.mod.partName);
      this.brand.set(this.mod.brand);
      this.cost.set(this.mod.cost);
      this.notes.set(this.mod.notes);
      this.icon.set(this.mod.icon ?? DEFAULT_MODIFICATION_ICON);
      this.iconTouched = !!this.mod.icon;
    }
  }

  onIconChange(icon: string): void {
    this.icon.set(icon);
    this.iconTouched = true;
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  async save(): Promise<void> {
    if (!this.partName().trim() || !this.brand().trim() || this.cost() < 0) {
      this.error.set('Rellena pieza, marca y coste.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const built: ModificationLog = {
        id: this.mod?.id ?? crypto.randomUUID(),
        vehicleId: this.vehicleId,
        category: this.category(),
        partName: this.partName().trim(),
        brand: this.brand().trim(),
        cost: this.cost(),
        notes: this.notes().trim(),
        photoURLs: this.mod?.photoURLs ?? [],
        createdAt: this.mod?.createdAt ?? new Date(),
        icon: this.icon(),
      };

      if (this.isEdit()) {
        await this.fs.updateModification(built);
      } else {
        await this.fs.saveModification(built);
      }
      await this.modalCtrl.dismiss(built, 'save');
    } catch {
      this.error.set('Error al guardar la modificación.');
    } finally {
      this.loading.set(false);
    }
  }
}
