import { Component, OnInit, signal, inject } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonIcon,
  ModalController, AlertController, ActionSheetController,
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
import { SwipeableCardComponent } from '../../../shared/components/swipeable-card/swipeable-card.component';
import { MaintenanceFormModalComponent } from '../../vehicles/vehicle-detail-modal/maintenance-form-modal/maintenance-form-modal.component';
import { ReminderFormModalComponent } from '../reminder-form-modal/reminder-form-modal.component';

interface ReminderItem { reminder: Reminder; vehicleName: string; }

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonIcon,
    LoadingComponent, EmptyStateComponent, SwipeableCardComponent,
  ],
  templateUrl: './reminder-list.page.html',
  styleUrls: ['./reminder-list.page.scss'],
})
export class ReminderListPage implements OnInit {
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  readonly theme = inject(ThemeService);
  readonly loading = signal(true);
  readonly reminders = signal<ReminderItem[]>([]);
  readonly maintenanceAlerts = signal<MaintenanceAlert[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
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

  async dismissAlert(alert: MaintenanceAlert): Promise<void> {
    const confirm = await this.alertCtrl.create({
      header: 'Ocultar aviso',
      message: `Este aviso volverá a aparecer hasta que registres el mantenimiento de "${alert.label}". ¿Ocultarlo por ahora?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Ocultar', role: 'destructive',
          handler: () => this.maintenanceAlerts.update(list =>
            list.filter(a => !(a.vehicleId === alert.vehicleId && a.type === alert.type))),
        },
      ],
    });
    await confirm.present();
  }

  async openAlertOptions(alert: MaintenanceAlert): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: alert.label,
      buttons: [
        { text: 'Registrar mantenimiento', icon: 'construct-outline', handler: () => this.openMaintenanceFormFor(alert) },
        { text: 'Ocultar aviso', icon: 'eye-off-outline', role: 'destructive', handler: () => this.dismissAlert(alert) },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openMaintenanceFormFor(alert: MaintenanceAlert): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MaintenanceFormModalComponent,
      componentProps: { vehicleId: alert.vehicleId, prefillType: alert.type },
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'save') await this.load();
  }

  async confirmDeleteReminder(item: ReminderItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar aviso',
      message: `¿Seguro que quieres eliminar "${item.reminder.title}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteReminder(item) },
      ],
    });
    await alert.present();
  }

  async openReminderOptions(item: ReminderItem): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: item.reminder.title,
      buttons: [
        { text: 'Editar', icon: 'create-outline', handler: () => this.openReminderForm(item) },
        {
          text: item.reminder.isTriggered ? 'Marcar como pendiente' : 'Marcar como completado',
          icon: 'checkmark-circle-outline',
          handler: () => this.toggleReminderTriggered(item),
        },
        { text: 'Eliminar', icon: 'trash-outline', role: 'destructive', handler: () => this.confirmDeleteReminder(item) },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openReminderForm(item: ReminderItem): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ReminderFormModalComponent,
      componentProps: { vehicleId: item.reminder.vehicleId, reminder: item.reminder },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<Reminder>();
    if (role !== 'save' || !data) return;
    this.reminders.update(list =>
      list.map(r => (r.reminder.id === data.id ? { ...r, reminder: data } : r)));
  }

  onCheckClick(event: Event, item: ReminderItem): void {
    event.stopPropagation();
    void this.resetReminder(item);
  }

  private async resetReminder(item: ReminderItem): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ReminderFormModalComponent,
      componentProps: {
        vehicleId: item.reminder.vehicleId,
        resetMode: true,
        reminder: { ...item.reminder, dueDate: undefined, dueMileage: undefined, isTriggered: false },
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<Reminder>();
    if (role !== 'save' || !data) return;
    this.reminders.update(list =>
      list.map(r => (r.reminder.id === data.id ? { ...r, reminder: data } : r)));
  }

  private async toggleReminderTriggered(item: ReminderItem): Promise<void> {
    const isTriggered = !item.reminder.isTriggered;
    await this.fs.updateReminder({ id: item.reminder.id, isTriggered });
    this.reminders.update(list =>
      list.map(r => (r.reminder.id === item.reminder.id ? { ...r, reminder: { ...r.reminder, isTriggered } } : r)));
  }

  private async deleteReminder(item: ReminderItem): Promise<void> {
    await this.fs.deleteReminder(item.reminder.id);
    this.reminders.update(list => list.filter(r => r.reminder.id !== item.reminder.id));
  }
}
