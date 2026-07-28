export interface Reminder {
  readonly id: string;
  vehicleId: string;
  title: string;
  dueDate?: Date;
  dueMileage?: number;
  isTriggered: boolean;
  createdAt: Date;
}

export function shouldTrigger(reminder: Reminder, currentMileage: number): boolean {
  if (reminder.isTriggered) return false;
  if (reminder.dueMileage !== undefined && currentMileage >= reminder.dueMileage) return true;
  if (reminder.dueDate !== undefined && reminder.dueDate <= new Date()) return true;
  return false;
}
