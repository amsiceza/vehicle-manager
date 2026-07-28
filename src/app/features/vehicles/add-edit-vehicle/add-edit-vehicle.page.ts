import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonTextarea, IonSpinner, IonLabel,
  IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddVehicleUseCase, VehicleLimitError } from '../../../domain/use-cases/add-vehicle.use-case';
import { Vehicle } from '../../../core/models/vehicle.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-add-edit-vehicle',
  standalone: true,
  imports: [
    FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonTextarea, IonSpinner, IonLabel,
    IonSelect, IonSelectOption,
  ],
  templateUrl: './add-edit-vehicle.page.html',
  styleUrls: ['./add-edit-vehicle.page.scss'],
})
export class AddEditVehiclePage implements OnInit {
  private readonly fs = inject(FirestoreService);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly addVehicleUseCase = inject(AddVehicleUseCase);

  readonly brand = signal('');
  readonly model = signal('');
  readonly licensePlate = signal('');
  readonly year = signal(new Date().getFullYear());
  readonly currentMileage = signal(0);
  readonly notes = signal('');

  readonly loading = signal(false);
  readonly error = signal('');
  readonly isEdit = signal(false);

  private currentUser: User | null = null;
  private editId: string | null = null;
  private existingPhotoURLs: string[] = [];

  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 60 }, (_, i) => this.currentYear - i);

  async ngOnInit(): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid) return;
    this.currentUser = await this.fs.fetchUser(uid);

    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.isEdit.set(true);
      const vehicles = await this.fs.fetchVehicles(uid);
      const v = vehicles.find(v => v.id === this.editId);
      if (v) {
        this.brand.set(v.brand);
        this.model.set(v.model);
        this.licensePlate.set(v.licensePlate);
        this.year.set(v.year);
        this.currentMileage.set(v.currentMileage);
        this.existingPhotoURLs = v.photoURLs;
      }
    }
  }

  async save(): Promise<void> {
    if (!this.brand() || !this.model() || !this.licensePlate()) {
      this.error.set('Rellena marca, modelo y matrícula.');
      return;
    }
    if (!this.currentUser) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const vehicle: Vehicle = {
        id: this.editId ?? crypto.randomUUID(),
        userId: this.currentUser.id,
        brand: this.brand().trim(),
        model: this.model().trim(),
        licensePlate: this.licensePlate().toUpperCase().trim(),
        year: this.year(),
        currentMileage: this.currentMileage(),
        photoURLs: this.existingPhotoURLs,
        specs: {},
        createdAt: new Date(),
      };

      if (this.isEdit()) {
        await this.fs.updateVehicle(vehicle);
      } else {
        await this.addVehicleUseCase.execute(vehicle, this.currentUser);
      }
      await this.router.navigateByUrl('/app/vehicles', { replaceUrl: true });
    } catch (e: unknown) {
      this.error.set(e instanceof VehicleLimitError ? e.message : 'Error al guardar el vehículo.');
    } finally {
      this.loading.set(false);
    }
  }
}
