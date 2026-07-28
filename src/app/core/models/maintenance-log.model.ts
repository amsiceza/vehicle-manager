export type MaintenanceType =
  | 'Aceite' | 'Frenos' | 'ITV' | 'Neumáticos' | 'Filtros'
  | 'Batería' | 'Bujías' | 'Transmisión' | 'Refrigerante' | 'Otro';

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  'Aceite', 'Frenos', 'ITV', 'Neumáticos', 'Filtros',
  'Batería', 'Bujías', 'Transmisión', 'Refrigerante', 'Otro',
];

export const MAINTENANCE_ICONS: Record<MaintenanceType, string> = {
  'Aceite': 'water',
  'Frenos': 'disc',
  'ITV': 'checkmark-circle-outline',
  'Neumáticos': 'radio-button-off-outline',
  'Filtros': 'filter-outline',
  'Batería': 'battery-charging-outline',
  'Bujías': 'flash-outline',
  'Transmisión': 'settings-outline',
  'Refrigerante': 'thermometer-outline',
  'Otro': 'wrench-outline',
};

export interface MaintenanceLog {
  readonly id: string;
  vehicleId: string;
  date: Date;
  mileage: number;
  type: MaintenanceType;
  cost: number;
  notes: string;
  attachmentURLs: string[];
}
