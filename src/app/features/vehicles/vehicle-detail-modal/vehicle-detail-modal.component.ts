import { Component, Input, OnInit, signal, inject, computed } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
  IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonInput,
  ModalController, AlertController, ToastController, ActionSheetController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { DemoService } from '../../../core/services/demo.service';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';
import { MaintenanceLog, MAINTENANCE_ICONS } from '../../../core/models/maintenance-log.model';
import { ModificationLog, DEFAULT_MODIFICATION_ICON } from '../../../core/models/modification-log.model';
import { RepairLog } from '../../../core/models/repair-log.model';
import { Reminder } from '../../../core/models/reminder.model';
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
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonInput,
    EmptyStateComponent, LoadingComponent, SwipeableCardComponent,
  ],
  templateUrl: './vehicle-detail-modal.component.html',
  styleUrls: ['./vehicle-detail-modal.component.scss'],
})
export class VehicleDetailModalComponent implements OnInit {
  @Input() vehicle!: Vehicle;

  private readonly fs = inject(FirestoreService);
  private readonly storage = inject(StorageService);
  private readonly demo = inject(DemoService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  readonly loading = signal(true);
  readonly uploadingPhoto = signal(false);
  readonly activeTab = signal<Tab>('mantenimiento');
  readonly showHistorial = signal(false);
  readonly maintenanceLogs = signal<MaintenanceLog[]>([]);
  readonly modifications = signal<ModificationLog[]>([]);
  readonly repairs = signal<RepairLog[]>([]);
  readonly reminders = signal<Reminder[]>([]);

  readonly MAINTENANCE_ICONS = MAINTENANCE_ICONS;
  readonly DEFAULT_MODIFICATION_ICON = DEFAULT_MODIFICATION_ICON;

  displayName(): string { return vehicleDisplayName(this.vehicle); }

  readonly totalMaintCost  = computed(() => this.maintenanceLogs().reduce((s, l) => s + l.cost, 0));
  readonly totalModCost    = computed(() => this.modifications().reduce((s, l) => s + l.cost, 0));
  readonly totalRepairCost = computed(() => this.repairs().reduce((s, l) => s + l.cost, 0));

  readonly remindersDone = computed(() => this.reminders().filter(r => r.isTriggered));

  async ngOnInit(): Promise<void> {
    const [maint, mods, reps, rems] = await Promise.all([
      this.fs.fetchMaintenanceLogs(this.vehicle.id),
      this.fs.fetchModifications(this.vehicle.id),
      this.fs.fetchRepairLogs(this.vehicle.id),
      this.fs.fetchReminders(this.vehicle.id),
    ]);
    this.maintenanceLogs.set(maint);
    this.modifications.set(mods);
    this.repairs.set(reps);
    this.reminders.set(
      [...rems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
    this.loading.set(false);
  }

  dismiss(): void { this.modalCtrl.dismiss(); }

  toggleHistorial(): void { this.showHistorial.update(v => !v); }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingPhoto.set(true);
    try {
      const url = this.demo.active()
        ? URL.createObjectURL(file)
        : await this.storage.uploadImage(file, `vehicles/${this.vehicle.id}/photo-${Date.now()}.jpg`);
      this.vehicle.photoURLs = [url, ...this.vehicle.photoURLs.slice(1)];
      await this.fs.updateVehicle({ id: this.vehicle.id, photoURLs: this.vehicle.photoURLs });
    } catch {
      const toast = await this.toastCtrl.create({ message: 'Error al subir la foto.', duration: 1500, position: 'bottom' });
      await toast.present();
    } finally {
      this.uploadingPhoto.set(false);
    }
  }

  private static readonly MAX_NAME_LENGTH = 40;

  readonly editingName = signal(false);
  readonly brandDraft = signal('');
  readonly modelDraft = signal('');
  readonly nameLimitReached = signal(false);
  readonly nameCharsUsed = computed(() => `${this.brandDraft()} ${this.modelDraft()}`.trim().length);
  readonly nameCharsLimit = VehicleDetailModalComponent.MAX_NAME_LENGTH;

  startEditName(): void {
    this.brandDraft.set(this.vehicle.brand);
    this.modelDraft.set(this.vehicle.model);
    this.nameLimitReached.set(false);
    this.editingName.set(true);
  }

  cancelEditName(): void {
    this.editingName.set(false);
  }

  onBrandDraftChange(value: string): void {
    this.brandDraft.set(this.clampToSharedBudget(value, this.modelDraft()));
  }

  onModelDraftChange(value: string): void {
    this.modelDraft.set(this.clampToSharedBudget(value, this.brandDraft()));
  }

  private clampToSharedBudget(changed: string, other: string): string {
    // The 40-char limit is shared between brand + model (joined by a space).
    const budget = Math.max(0, VehicleDetailModalComponent.MAX_NAME_LENGTH - other.length - 1);
    const exceeded = changed.length > budget;
    if (exceeded && !this.nameLimitReached()) {
      void this.warnNameLimitReached();
    }
    this.nameLimitReached.set(exceeded);
    return changed.slice(0, budget);
  }

  private async warnNameLimitReached(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: `Has alcanzado el límite de ${VehicleDetailModalComponent.MAX_NAME_LENGTH} caracteres.`,
      duration: 1600,
      position: 'bottom',
      color: 'warning',
    });
    await toast.present();
  }

  async saveEditName(): Promise<void> {
    const brand = this.brandDraft().trim();
    const model = this.modelDraft().trim();
    if (!brand || !model) return;

    this.vehicle.brand = brand;
    this.vehicle.model = model;
    this.editingName.set(false);
    await this.fs.updateVehicle({ id: this.vehicle.id, brand, model });
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

  async openMaintenanceOptions(log: MaintenanceLog): Promise<void> {
    await this.presentOptions(log.type, () => this.openMaintenanceForm(log), () => this.confirmDeleteMaintenance(log));
  }

  async openModificationOptions(mod: ModificationLog): Promise<void> {
    await this.presentOptions(mod.partName, () => this.openModificationForm(mod), () => this.confirmDeleteModification(mod));
  }

  async openRepairOptions(rep: RepairLog): Promise<void> {
    await this.presentOptions(rep.description, () => this.openRepairForm(rep), () => this.confirmDeleteRepair(rep));
  }

  private async presentOptions(header: string, onEdit: () => void, onDelete: () => void): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header,
      buttons: [
        { text: 'Editar', icon: 'create-outline', handler: onEdit },
        { text: 'Eliminar', icon: 'trash-outline', role: 'destructive', handler: onDelete },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
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
