import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonInput, IonSelect, IonSelectOption, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { DemoService } from '../../../core/services/demo.service';
import { AddVehicleUseCase, VehicleLimitError } from '../../../domain/use-cases/add-vehicle.use-case';
import { Vehicle } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
    IonInput, IonSelect, IonSelectOption, IonSpinner,
  ],
  templateUrl: './vehicle-form-modal.component.html',
  styleUrls: ['./vehicle-form-modal.component.scss'],
})
export class VehicleFormModalComponent implements OnInit {
  @Input() vehicle?: Vehicle;

  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreService);
  private readonly storage = inject(StorageService);
  private readonly demo = inject(DemoService);
  private readonly addVehicleUseCase = inject(AddVehicleUseCase);
  private readonly modalCtrl = inject(ModalController);

  private readonly vehicleId = crypto.randomUUID();

  readonly isEditMode = signal(false);

  readonly brand = signal('');
  readonly model = signal('');
  readonly licensePlate = signal('');
  readonly year = signal(new Date().getFullYear());
  readonly currentMileage = signal(0);

  readonly photoFile = signal<File | null>(null);
  readonly photoPreviewURL = signal('');

  readonly loading = signal(false);
  readonly error = signal('');

  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 60 }, (_, i) => this.currentYear - i);

  ngOnInit(): void {
    const v = this.vehicle;
    if (!v) return;
    this.isEditMode.set(true);
    this.brand.set(v.brand);
    this.model.set(v.model);
    this.licensePlate.set(v.licensePlate);
    this.year.set(v.year);
    this.currentMileage.set(v.currentMileage);
    this.photoPreviewURL.set(v.photoURLs[0] ?? '');
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.photoFile.set(file);
    this.photoPreviewURL.set(URL.createObjectURL(file));
  }

  async save(): Promise<void> {
    if (!this.brand().trim() || !this.model().trim() || !this.licensePlate().trim()) {
      this.error.set('Rellena marca, modelo y matrícula.');
      return;
    }
    const uid = this.auth.currentUid();
    if (!uid) {
      this.error.set('Sesión no encontrada.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const editing = this.vehicle;
      const photoURLs = editing ? [...editing.photoURLs] : [];
      const file = this.photoFile();
      if (file) {
        const url = this.demo.active()
          ? URL.createObjectURL(file)
          : await this.storage.uploadImage(file, `vehicles/${this.vehicleId}/photo-${Date.now()}.jpg`);
        photoURLs[0] = url;
      }

      if (editing) {
        const updated: Vehicle = {
          ...editing,
          brand: this.brand().trim(),
          model: this.model().trim(),
          licensePlate: this.licensePlate().toUpperCase().trim(),
          year: this.year(),
          currentMileage: this.currentMileage(),
          photoURLs,
        };
        await this.fs.updateVehicle(updated);
        await this.modalCtrl.dismiss(updated, 'save');
        return;
      }

      const user = await this.fs.fetchUser(uid);
      if (!user) {
        this.error.set('Sesión no encontrada.');
        return;
      }

      const built: Vehicle = {
        id: this.vehicleId,
        userId: uid,
        brand: this.brand().trim(),
        model: this.model().trim(),
        licensePlate: this.licensePlate().toUpperCase().trim(),
        year: this.year(),
        currentMileage: this.currentMileage(),
        photoURLs,
        specs: {},
        createdAt: new Date(),
      };
      await this.addVehicleUseCase.execute(built, user);
      await this.modalCtrl.dismiss(built, 'save');
    } catch (e: unknown) {
      this.error.set(e instanceof VehicleLimitError ? e.message : 'Error al guardar el vehículo.');
    } finally {
      this.loading.set(false);
    }
  }
}
