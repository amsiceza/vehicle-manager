import { Injectable } from '@angular/core';
import { FREE_VEHICLE_LIMIT } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class CheckProLimitUseCase {
  canAddVehicle(currentCount: number, isPro: boolean): boolean {
    return isPro || currentCount < FREE_VEHICLE_LIMIT;
  }

  limitLabel(currentCount: number): string {
    return `${currentCount}/${FREE_VEHICLE_LIMIT}`;
  }

  progressPercent(currentCount: number): number {
    return Math.min(100, (currentCount / FREE_VEHICLE_LIMIT) * 100);
  }
}
