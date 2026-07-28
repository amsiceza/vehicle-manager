import { MaintenanceType } from './maintenance-log.model';

export interface MaintenanceInterval {
  type: MaintenanceType;
  label: string;
  icon: string;
  intervalKm?: number;
  intervalMonths?: number;
}

export const MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
  { type: 'Aceite',        label: 'Cambio de aceite',         icon: 'water',                      intervalKm: 10_000, intervalMonths: 12 },
  { type: 'Filtros',       label: 'Filtros aire y habitáculo', icon: 'filter-outline',             intervalKm: 20_000, intervalMonths: 24 },
  { type: 'Frenos',        label: 'Inspección de frenos',     icon: 'disc',                       intervalKm: 30_000, intervalMonths: 36 },
  { type: 'Neumáticos',    label: 'Revisión neumáticos',      icon: 'radio-button-off-outline',   intervalKm: 40_000, intervalMonths: 48 },
  { type: 'ITV',           label: 'ITV',                      icon: 'checkmark-circle-outline',                       intervalMonths: 24 },
  { type: 'Bujías',        label: 'Bujías',                   icon: 'flash-outline',              intervalKm: 60_000 },
  { type: 'Refrigerante',  label: 'Refrigerante',             icon: 'thermometer-outline',        intervalKm: 60_000, intervalMonths: 36 },
  { type: 'Transmisión',   label: 'Aceite transmisión',       icon: 'settings-outline',           intervalKm: 60_000, intervalMonths: 60 },
  { type: 'Batería',       label: 'Revisión batería',         icon: 'battery-charging-outline',                       intervalMonths: 60 },
];

export type AlertStatus = 'overdue' | 'upcoming' | 'ok';

export interface MaintenanceAlert {
  vehicleId: string;
  vehicleName: string;
  type: MaintenanceType;
  label: string;
  icon: string;
  status: AlertStatus;
  nextKm?: number;
  nextDate?: Date;
  currentKm: number;
  kmRemaining?: number;
  daysRemaining?: number;
}
