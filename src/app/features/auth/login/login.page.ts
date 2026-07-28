import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonInput, IonSpinner, IonIcon,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonButton, IonInput, IonSpinner, IonIcon],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly demoLoading = signal(false);
  readonly error = signal('');

  async login(): Promise<void> {
    if (!this.email() || !this.password()) { this.error.set('Rellena todos los campos.'); return; }
    this.loading.set(true); this.error.set('');
    try {
      await this.auth.login(this.email(), this.password());
      await this.router.navigateByUrl('/app/vehicles', { replaceUrl: true });
    } catch (e: unknown) {
      this.error.set(this.friendlyError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async demoLogin(): Promise<void> {
    this.demoLoading.set(true);
    await this.auth.demoLogin();
  }

  async resetPassword(): Promise<void> {
    if (!this.email()) { this.error.set('Introduce tu email primero.'); return; }
    try {
      await this.auth.resetPassword(this.email());
      this.error.set('');
      alert('Correo de recuperación enviado.');
    } catch (e: unknown) {
      this.error.set(this.friendlyError(e));
    }
  }

  private friendlyError(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) return 'Email o contraseña incorrectos.';
    if (code.includes('too-many-requests')) return 'Demasiados intentos. Espera un momento.';
    if (code.includes('network')) return 'Sin conexión. Usa el modo demo.';
    return 'Error al iniciar sesión.';
  }
}
