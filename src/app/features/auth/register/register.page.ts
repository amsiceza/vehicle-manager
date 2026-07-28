import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonInput, IonSpinner, IonIcon,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { FREE_VEHICLE_LIMIT } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonButton, IonInput, IonSpinner, IonIcon],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly limit = FREE_VEHICLE_LIMIT;

  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  async register(): Promise<void> {
    if (!this.email() || !this.password()) { this.error.set('Rellena todos los campos.'); return; }
    if (this.password() !== this.confirmPassword()) { this.error.set('Las contraseñas no coinciden.'); return; }
    if (this.password().length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    this.loading.set(true); this.error.set('');
    try {
      await this.auth.register(this.email(), this.password());
      await this.router.navigateByUrl('/app/vehicles', { replaceUrl: true });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      this.error.set(code.includes('email-already-in-use') ? 'Este email ya está registrado.' : 'Error al crear la cuenta.');
    } finally {
      this.loading.set(false);
    }
  }
}
