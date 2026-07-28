import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../core/services/firestore.service';
import { PdfService } from '../../../core/services/pdf.service';
import { AuthService } from '../../../core/services/auth.service';
import { Vehicle, vehicleDisplayName } from '../../../core/models/vehicle.model';
import { MaintenanceLog, MAINTENANCE_ICONS } from '../../../core/models/maintenance-log.model';
import { ModificationLog } from '../../../core/models/modification-log.model';
import { User } from '../../../core/models/user.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaywallComponent } from '../../../shared/components/paywall/paywall.component';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [
    FormsModule, CurrencyPipe, DatePipe,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    LoadingComponent, EmptyStateComponent, PaywallComponent, DecimalPipe,
  ],
  templateUrl: './vehicle-detail.page.html',
  styleUrls: ['./vehicle-detail.page.scss'],
})
export class VehicleDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fs = inject(FirestoreService);
  private readonly pdfService = inject(PdfService);
  private readonly auth = inject(AuthService);

  readonly vehicle = signal<Vehicle | null>(null);
  readonly user = signal<User | null>(null);
  readonly maintenanceLogs = signal<MaintenanceLog[]>([]);
  readonly modifications = signal<ModificationLog[]>([]);
  readonly loading = signal(true);
  readonly pdfLoading = signal(false);
  readonly showPaywall = signal(false);
  readonly activeTab = signal<'ficha' | 'mantenimiento' | 'modificaciones'>('ficha');

  readonly totalMaintCost = computed(() => this.maintenanceLogs().reduce((s, l) => s + l.cost, 0));
  readonly totalModCost = computed(() => this.modifications().reduce((s, m) => s + m.cost, 0));
  readonly totalCost = computed(() => this.totalMaintCost() + this.totalModCost());

  readonly displayName = computed(() => vehicleDisplayName(this.vehicle()!));
  readonly MAINTENANCE_ICONS = MAINTENANCE_ICONS;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    const uid = this.auth.currentUid()!;
    this.loading.set(true);
    try {
      const [vehicles, user, maintenance, mods] = await Promise.all([
        this.fs.fetchVehicles(uid),
        this.fs.fetchUser(uid),
        this.fs.fetchMaintenanceLogs(id),
        this.fs.fetchModifications(id),
      ]);
      this.vehicle.set(vehicles.find(v => v.id === id) ?? null);
      this.user.set(user);
      this.maintenanceLogs.set(maintenance);
      this.modifications.set(mods);
    } finally {
      this.loading.set(false);
    }
  }

  async exportPdf(): Promise<void> {
    if (!this.user()?.isPro) { this.showPaywall.set(true); return; }
    this.pdfLoading.set(true);
    try {
      await this.pdfService.generateReport(this.vehicle()!, this.maintenanceLogs(), this.modifications());
    } finally {
      this.pdfLoading.set(false);
    }
  }

  goAddMaintenance(): void { this.router.navigate(['/vehicles', this.vehicle()!.id, 'maintenance', 'add']); }
  goAddModification(): void { this.router.navigate(['/vehicles', this.vehicle()!.id, 'modifications', 'add']); }

  eur(v: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);
  }

  formatDate(d: Date): string {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(d);
  }

  specEntries(specs: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(specs).map(([key, value]) => ({ key, value }));
  }
}
