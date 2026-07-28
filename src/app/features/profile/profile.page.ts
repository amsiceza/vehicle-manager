import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButton, IonIcon, IonInput, IonSpinner, AlertController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { DemoService } from '../../core/services/demo.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonIcon, IonInput, IonSpinner,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreService);
  private readonly demo = inject(DemoService);
  private readonly alertCtrl = inject(AlertController);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly isDemo = this.demo.active;

  readonly editName = signal('');
  readonly editBirthDate = signal('');

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    if (u.name) return u.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    return (u.email[0] ?? '?').toUpperCase();
  });

  readonly memberSince = computed(() => {
    const u = this.user();
    if (!u) return '';
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(u.createdAt);
  });

  async ngOnInit(): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid) { this.loading.set(false); return; }
    const u = await this.fs.fetchUser(uid);
    this.user.set(u);
    this.editName.set(u?.name ?? '');
    this.editBirthDate.set(u?.birthDate ? this.toInputDate(u.birthDate) : '');
    this.loading.set(false);
  }

  async saveProfile(): Promise<void> {
    const u = this.user();
    if (!u) return;
    this.saving.set(true);
    try {
      const updated: User = {
        ...u,
        name: this.editName().trim() || u.name,
        birthDate: this.editBirthDate() ? new Date(this.editBirthDate()) : u.birthDate,
      };
      await this.fs.updateUser(updated);
      this.user.set(updated);
    } finally { this.saving.set(false); }
  }

  async confirmSignOut(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', role: 'destructive', handler: () => this.auth.signOut() },
      ],
    });
    await alert.present();
  }

  formatBirthDate(d?: Date): string {
    if (!d) return '—';
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(
      d instanceof Date ? d : new Date(d)
    );
  }

  private toInputDate(d: Date): string {
    return (d instanceof Date ? d : new Date(d)).toISOString().substring(0, 10);
  }
}
