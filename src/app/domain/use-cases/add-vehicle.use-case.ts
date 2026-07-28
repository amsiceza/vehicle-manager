import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { User, FREE_VEHICLE_LIMIT } from '../../core/models/user.model';

export class VehicleLimitError extends Error {
  constructor() {
    super(`Has alcanzado el límite de ${FREE_VEHICLE_LIMIT} vehículos en el plan gratuito. Actualiza a Pro para añadir más.`);
    this.name = 'VehicleLimitError';
  }
}

@Injectable({ providedIn: 'root' })
export class AddVehicleUseCase {
  private readonly fs = inject(FirestoreService);

  async execute(vehicle: Vehicle, user: User): Promise<void> {
    if (!user.isPro) {
      const existing = await this.fs.fetchVehicles(user.id);
      if (existing.length >= FREE_VEHICLE_LIMIT) throw new VehicleLimitError();
    }
    await this.fs.saveVehicle(vehicle);
  }
}
