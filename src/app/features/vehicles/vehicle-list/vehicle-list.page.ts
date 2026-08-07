import { Component, OnInit, signal, inject, computed } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
  ModalController, AlertController, ActionSheetController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { DemoService } from '../../../core/services/demo.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CheckProLimitUseCase } from '../../../domain/use-cases/check-pro-limit.use-case';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';
import { User } from '../../../core/models/user.model';
import { VehicleDetailModalComponent } from '../vehicle-detail-modal/vehicle-detail-modal.component';
import { VehicleFormModalComponent } from '../vehicle-form-modal/vehicle-form-modal.component';
import { PaywallComponent } from '../../../shared/components/paywall/paywall.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { SwipeableCardComponent } from '../../../shared/components/swipeable-card/swipeable-card.component';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
    PaywallComponent, EmptyStateComponent, LoadingComponent, SwipeableCardComponent,
  ],
  templateUrl: './vehicle-list.page.html',
  styleUrls: ['./vehicle-list.page.scss'],
})
export class VehicleListPage implements OnInit {
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);
  private readonly demo = inject(DemoService);
  private readonly limitUseCase = inject(CheckProLimitUseCase);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  readonly theme = inject(ThemeService);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly currentUser = signal<User | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showPaywall = signal(false);
  readonly isDemo = this.demo.active;

  readonly canAdd = computed(() =>
    this.limitUseCase.canAddVehicle(this.vehicles().length, this.currentUser()?.isPro ?? false),
  );
  readonly limitLabel = computed(() => this.limitUseCase.limitLabel(this.vehicles().length));

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const uid = this.auth.currentUid();
      if (!uid) { this.error.set('Sesión no encontrada.'); return; }
      const [user, vehicles] = await Promise.all([
        this.fs.fetchUser(uid),
        this.fs.fetchVehicles(uid),
      ]);
      this.currentUser.set(user);
      this.vehicles.set(vehicles);
    } catch (e) {
      console.error(e);
      this.error.set('No se pudieron cargar los vehículos.');
    } finally {
      this.loading.set(false);
    }
  }

  async openDetail(vehicle: Vehicle): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: VehicleDetailModalComponent,
      componentProps: { vehicle },
      // Full-screen, static, scrollable — no drag handle
    });
    await modal.present();
  }

  handleAdd(): void {
    if (this.canAdd()) { void this.openVehicleForm(); }
    else { this.showPaywall.set(true); }
  }

  private async openVehicleForm(vehicle?: Vehicle): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: VehicleFormModalComponent,
      componentProps: vehicle ? { vehicle } : {},
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<Vehicle>();
    if (role !== 'save' || !data) return;
    if (vehicle) {
      this.vehicles.update(list => list.map(v => (v.id === data.id ? data : v)));
    } else {
      this.vehicles.update(list => [data, ...list]);
    }
  }

  async confirmDelete(vehicle: Vehicle): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar vehículo',
      message: `¿Seguro que quieres eliminar ${vehicleDisplayName(vehicle)}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteVehicle(vehicle) },
      ],
    });
    await alert.present();
  }

  async openOptionsMenu(vehicle: Vehicle): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: vehicleDisplayName(vehicle),
      buttons: [
        { text: 'Editar', icon: 'create-outline', handler: () => this.openVehicleForm(vehicle) },
        { text: 'Eliminar', icon: 'trash-outline', role: 'destructive', handler: () => this.confirmDelete(vehicle) },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async deleteVehicle(vehicle: Vehicle): Promise<void> {
    await this.fs.deleteVehicle(vehicle.id);
    this.vehicles.update(list => list.filter(v => v.id !== vehicle.id));
  }
}
