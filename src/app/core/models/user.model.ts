export interface User {
  readonly id: string;
  email: string;
  name?: string;
  birthDate?: Date;
  photoURL?: string;
  isPro: boolean;
  createdAt: Date;
}

export const FREE_VEHICLE_LIMIT = 3;
