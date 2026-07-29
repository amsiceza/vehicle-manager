export interface ModificationLog {
  readonly id: string;
  vehicleId: string;
  category: string;
  partName: string;
  brand: string;
  cost: number;
  notes: string;
  photoURLs: string[];
  createdAt: Date;
  icon?: string;
}

export const DEFAULT_MODIFICATION_ICON = 'sparkles-outline';

export const MODIFICATION_CATEGORIES = [
  'Motor', 'Escape', 'Suspensión', 'Frenos', 'Aerodinámica',
  'Interior', 'Exterior', 'Audio', 'Llantas', 'Electrónica', 'Otro',
];
