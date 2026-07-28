export interface Vehicle {
  readonly id: string;
  userId: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  currentMileage: number;
  photoURLs: string[];
  specs: Record<string, string>;
  createdAt: Date;
}

export function vehicleDisplayName(v: Vehicle): string {
  return `${v.year} ${v.brand} ${v.model}`;
}
