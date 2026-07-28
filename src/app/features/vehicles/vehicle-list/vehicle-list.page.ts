import { Component, OnInit, signal, inject, computed } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
  ModalController,
} from '@ionic/angular/standalone';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { DemoService } from '../../../core/services/demo.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CheckProLimitUseCase } from '../../../domain/use-cases/check-pro-limit.use-case';
import { Vehicle } from '../../../core/models/vehicle.model';
import { User } from '../../../core/models/user.model';
import { VehicleDetailModalComponent } from '../vehicle-detail-modal/vehicle-detail-modal.component';
import { PaywallComponent } from '../../../shared/components/paywall/paywall.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
    PaywallComponent, EmptyStateComponent, LoadingComponent,
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
    if (this.canAdd()) { /* TODO: add form */ }
    else { this.showPaywall.set(true); }
  }
}
