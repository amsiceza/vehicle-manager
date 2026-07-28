import { Component, OnInit, signal, inject } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonIcon,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Reminder } from '../../../core/models/reminder.model';
import { Vehicle } from '../../../core/models/vehicle.model';
import { MaintenanceLog } from '../../../core/models/maintenance-log.model';
import { MAINTENANCE_INTERVALS, MaintenanceAlert, AlertStatus } from '../../../core/models/maintenance-schedule.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

interface ReminderItem { reminder: Reminder; vehicleName: string; }

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonIcon,
    LoadingComponent, EmptyStateComponent,
  ],
  templateUrl: './reminder-list.page.html',
  styleUrls: ['./reminder-list.page.scss'],
})
export class ReminderListPage implements OnInit {
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);

  readonly theme = inject(ThemeService);
  readonly loading = signal(true);
  readonly reminders = signal<ReminderItem[]>([]);
  readonly maintenanceAlerts = signal<MaintenanceAlert[]>([]);

  async ngOnInit(): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid) { this.loading.set(false); return; }
    try {
      const vehicles = await this.fs.fetchVehicles(uid);
      const remindersNested = await Promise.all(
        vehicles.map(v => this.fs.fetchReminders(v.id)
          .then(rs => rs.map(r => ({ reminder: r, vehicleName: `${v.brand} ${v.model}` }))))
      );
      this.reminders.set(
        remindersNested.flat().sort((a, b) => {
          const da = a.reminder.dueDate?.getTime() ?? Infinity;
          const db = b.reminder.dueDate?.getTime() ?? Infinity;
          return da - db;
        })
      );
      const logs = await Promise.all(
        vehicles.map(v => this.fs.fetchMaintenanceLogs(v.id).then(l => ({ vehicle: v, logs: l })))
      );
      this.maintenanceAlerts.set(this.computeAlerts(vehicles, logs));
    } finally {
      this.loading.set(false);
    }
  }

  private computeAlerts(
    vehicles: Vehicle[],
    data: { vehicle: Vehicle; logs: MaintenanceLog[] }[],
  ): MaintenanceAlert[] {
    const alerts: MaintenanceAlert[] = [];
    for (const { vehicle, logs } of data) {
      const vehicleName = `${vehicle.brand} ${vehicle.model}`;
      for (const interval of MAINTENANCE_INTERVALS) {
        const last = logs
          .filter(l => l.type === interval.type)
          .sort((a, b) => {
            const da = a.date instanceof Date ? a.date : new Date(a.date);
            const db = b.date instanceof Date ? b.date : new Date(b.date);
            return db.getTime() - da.getTime();
          })[0];

        let status: AlertStatus = 'ok';
        let nextKm: number | undefined;
        let nextDate: Date | undefined;
        let kmRemaining: number | undefined;
        let daysRemaining: number | undefined;

        if (interval.intervalKm) {
          nextKm = last ? last.mileage + interval.intervalKm : interval.intervalKm;
          kmRemaining = nextKm - vehicle.currentMileage;
          if (kmRemaining <= 0) status = 'overdue';
          else if (kmRemaining <= 2_500) status = 'upcoming';
        }
        if (interval.intervalMonths && last) {
          const lastDate = last.date instanceof Date ? last.date : new Date(last.date);
          nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + interval.intervalMonths);
          daysRemaining = Math.ceil((nextDate.getTime() - Date.now()) / 86_400_000);
          if (daysRemaining <= 0 && status !== 'overdue') status = 'overdue';
          else if (daysRemaining <= 45 && status === 'ok') status = 'upcoming';
        }

        if (status !== 'ok') {
          alerts.push({ vehicleId: vehicle.id, vehicleName, type: interval.type,
            label: interval.label, icon: interval.icon, status,
            nextKm, nextDate, currentKm: vehicle.currentMileage, kmRemaining, daysRemaining });
        }
      }
    }
    return alerts.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'overdue' ? -1 : 1;
      return (a.kmRemaining ?? Infinity) - (b.kmRemaining ?? Infinity);
    });
  }

  formatDate(d?: Date): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
  }

  formatKm(n: number): string { return n.toLocaleString('es-ES'); }
}
