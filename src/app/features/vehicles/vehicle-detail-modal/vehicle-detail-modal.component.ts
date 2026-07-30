import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonBackButton, IonTitle,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
  AlertController, ToastController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';
import { MaintenanceLog, MAINTENANCE_ICONS } from '../../../core/models/maintenance-log.model';
import { ModificationLog, DEFAULT_MODIFICATION_ICON } from '../../../core/models/modification-log.model';
import { RepairLog } from '../../../core/models/repair-log.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { SwipeableCardComponent } from '../../../shared/components/swipeable-card/swipeable-card.component';
import { MaintenanceFormModalComponent } from './maintenance-form-modal/maintenance-form-modal.component';
import { ModificationFormModalComponent } from './modification-form-modal/modification-form-modal.component';
import { RepairFormModalComponent } from './repair-form-modal/repair-form-modal.component';

type Tab = 'mantenimiento' | 'modificaciones' | 'reparaciones';

@Component({
  selector: 'app-vehicle-detail-modal',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    NgTemplateOutlet,
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonBackButton, IonTitle,
    IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    EmptyStateComponent, LoadingComponent, SwipeableCardComponent,
    MaintenanceFormModalComponent, ModificationFormModalComponent, RepairFormModalComponent,
  ],
  templateUrl: './vehicle-detail-modal.component.html',
  styleUrls: ['./vehicle-detail-modal.component.scss'],
})
export class VehicleDetailModalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  readonly loading = signal(true);
  readonly vehicle = signal<Vehicle | null>(null);
  readonly activeTab = signal<Tab>('mantenimiento');
  readonly maintenanceLogs = signal<MaintenanceLog[]>([]);
  readonly modifications = signal<ModificationLog[]>([]);
  readonly repairs = signal<RepairLog[]>([]);

  readonly formView = signal<'none' | Tab>('none');
  readonly editingMaintenance = signal<MaintenanceLog | undefined>(undefined);
  readonly editingModification = signal<ModificationLog | undefined>(undefined);
  readonly editingRepair = signal<RepairLog | undefined>(undefined);

  readonly MAINTENANCE_ICONS = MAINTENANCE_ICONS;
  readonly DEFAULT_MODIFICATION_ICON = DEFAULT_MODIFICATION_ICON;
  readonly displayName = computed(() => {
    const v = this.vehicle();
    return v ? vehicleDisplayName(v) : '';
  });

  readonly totalMaintCost  = computed(() => this.maintenanceLogs().reduce((s, l) => s + l.cost, 0));
  readonly totalModCost    = computed(() => this.modifications().reduce((s, l) => s + l.cost, 0));
  readonly totalRepairCost = computed(() => this.repairs().reduce((s, l) => s + l.cost, 0));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    const uid = this.auth.currentUid();
    if (!uid) { this.router.navigateByUrl('/auth/login'); return; }

    const vehicles = await this.fs.fetchVehicles(uid);
    const vehicle = vehicles.find(v => v.id === id) ?? null;
    if (!vehicle) { this.loading.set(false); return; }
    this.vehicle.set(vehicle);

    const [maint, mods, reps] = await Promise.all([
      this.fs.fetchMaintenanceLogs(id),
      this.fs.fetchModifications(id),
      this.fs.fetchRepairLogs(id),
    ]);
    this.maintenanceLogs.set(maint);
    this.modifications.set(mods);
    this.repairs.set(reps);
    this.loading.set(false);
  }

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

  openMaintenanceForm(log?: MaintenanceLog): void {
    this.editingMaintenance.set(log);
    this.formView.set('mantenimiento');
  }

  openModificationForm(mod?: ModificationLog): void {
    this.editingModification.set(mod);
    this.formView.set('modificaciones');
  }

  openRepairForm(repair?: RepairLog): void {
    this.editingRepair.set(repair);
    this.formView.set('reparaciones');
  }

  closeForm(): void { this.formView.set('none'); }

  onMaintenanceSaved(data: MaintenanceLog): void {
    this.maintenanceLogs.update(list => {
      const i = list.findIndex(l => l.id === data.id);
      if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
      return [data, ...list];
    });
    this.closeForm();
  }

  onModificationSaved(data: ModificationLog): void {
    this.modifications.update(list => {
      const i = list.findIndex(m => m.id === data.id);
      if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
      return [data, ...list];
    });
    this.closeForm();
  }

  onRepairSaved(data: RepairLog): void {
    this.repairs.update(list => {
      const i = list.findIndex(r => r.id === data.id);
      if (i >= 0) { const copy = [...list]; copy[i] = data; return copy; }
      return [data, ...list];
    });
    this.closeForm();
  }

  async confirmDeleteMaintenance(log: MaintenanceLog): Promise<void> {
    await this.confirmAndDelete(
      'Eliminar registro',
      `¿Seguro que quieres eliminar "${log.type}"? Esta acción no se puede deshacer.`,
      async () => {
        await this.fs.deleteMaintenanceLog(log.id);
        this.maintenanceLogs.update(list => list.filter(l => l.id !== log.id));
      },
    );
  }

  async confirmDeleteModification(mod: ModificationLog): Promise<void> {
    await this.confirmAndDelete(
      'Eliminar modificación',
      `¿Seguro que quieres eliminar "${mod.partName}"? Esta acción no se puede deshacer.`,
      async () => {
        await this.fs.deleteModification(mod.id);
        this.modifications.update(list => list.filter(m => m.id !== mod.id));
      },
    );
  }

  async confirmDeleteRepair(rep: RepairLog): Promise<void> {
    await this.confirmAndDelete(
      'Eliminar reparación',
      `¿Seguro que quieres eliminar "${rep.description}"? Esta acción no se puede deshacer.`,
      async () => {
        await this.fs.deleteRepairLog(rep.id);
        this.repairs.update(list => list.filter(r => r.id !== rep.id));
      },
    );
  }

  async openOptionsMenu(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'Menú de opciones próximamente',
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }

  private async confirmAndDelete(header: string, message: string, handler: () => Promise<void>): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler },
      ],
    });
    await alert.present();
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
