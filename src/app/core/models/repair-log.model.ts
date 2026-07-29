export interface RepairLog {
  readonly id: string;
  vehicleId: string;
  date: Date;
  mileage: number;
  description: string;
  workshop: string;
  cost: number;
  isInsuranceClaim: boolean;
  notes: string;
  createdAt: Date;
  icon?: string;
}
