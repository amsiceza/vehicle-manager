import { Component, Input, OnInit, signal, inject, computed } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';
import { MaintenanceLog, MAINTENANCE_ICONS } from '../../../core/models/maintenance-log.model';
import { ModificationLog, DEFAULT_MODIFICATION_ICON } from '../../../core/models/modification-log.model';
import { RepairLog } from '../../../core/models/repair-log.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MaintenanceFormModalComponent } from './maintenance-form-modal/maintenance-form-modal.component';
import { ModificationFormModalComponent } from './modification-form-modal/modification-form-modal.component';
import { RepairFormModalComponent } from './repair-form-modal/repair-form-modal.component';

type Tab = 'mantenimiento' | 'modificaciones' | 'reparaciones';

@Component({
  selector: 'app-vehicle-detail-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    EmptyStateComponent, LoadingComponent,
  ],
  templateUrl: './vehicle-detail-modal.component.html',
  styleUrls: ['./vehicle-detail-modal.component.scss'],
})
export class VehicleDetailModalComponent implements OnInit {
  @Input() vehicle!: Vehicle;

  private readonly fs = inject(FirestoreService);
  private readonly modalCtrl = inject(ModalController);

  readonly loading = signal(true);
  readonly activeTab = signal<Tab>('mantenimiento');
  readonly maintenanceLogs = signal<MaintenanceLog[]>([]);
  readonly modifications = signal<ModificationLog[]>([]);
  readonly repairs = signal<RepairLog[]>([]);

  readonly MAINTENANCE_ICONS = MAINTENANCE_ICONS;
  readonly DEFAULT_MODIFICATION_ICON = DEFAULT_MODIFICATION_ICON;
  readonly displayName = computed(() => vehicleDisplayName(this.vehicle));

  readonly totalMaintCost  = computed(() => this.maintenanceLogs().reduce((s, l) => s + l.cost, 0));
  readonly totalModCost    = computed(() => this.modifications().reduce((s, l) => s + l.cost, 0));
  readonly totalRepairCost = computed(() => this.repairs().reduce((s, l) => s + l.cost, 0));

  async ngOnInit(): Promise<void> {
    const [maint, mods, reps] = await Promise.all([
      this.fs.fetchMaintenanceLogs(this.vehicle.id),
      this.fs.fetchModifications(this.vehicle.id),
      this.fs.fetchRepairLogs(this.vehicle.id),
    ]);
    this.maintenanceLogs.set(maint);
    this.modifications.set(mods);
    this.repairs.set(reps);
    this.loading.set(false);
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  repairIcon(rep: RepairLog): string {
    return rep.icon ?? (rep.isInsuranceClaim ? 'shield-checkmark-outline' : 'hammer-outline');
  }

  addCurrentTabItem(): void {
    switch (this.activeTab()) {
      case 'mantenimiento':  this.openMaintenanceForm(); break;
      case 'modificaciones': this.openModificationForm(); break;
      case 'reparaciones':   this.openRepairForm(); break;
    }
  }

  async openMaintenanceForm(log?: MaintenanceLog): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MaintenanceFormModalComponent,
      componentProps: { vehicleId: this.vehicle.id, log },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<MaintenanceLog>();
    if (role === 'save' && data) {
      this.maintenanceLogs.update(list => {
        const i = list.findIndex(l => l.id === data.id);
        if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
        return [data, ...list];
      });
    }
  }

  async openModificationForm(mod?: ModificationLog): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ModificationFormModalComponent,
      componentProps: { vehicleId: this.vehicle.id, mod },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<ModificationLog>();
    if (role === 'save' && data) {
      this.modifications.update(list => {
        const i = list.findIndex(m => m.id === data.id);
        if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
        return [data, ...list];
      });
    }
  }

  async openRepairForm(repair?: RepairLog): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: RepairFormModalComponent,
      componentProps: { vehicleId: this.vehicle.id, repair },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<RepairLog>();
    if (role === 'save' && data) {
      this.repairs.update(list => {
        const i = list.findIndex(r => r.id === data.id);
        if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
        return [data, ...list];
      });
    }
  }

  eur(v: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);
  }

  fmtDate(d: Date): string {
    const date = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(date);
  }

  fmtMonth(d: Date): string {
    const date = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(date);
  }
}
