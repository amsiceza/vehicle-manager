import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, authState,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { DemoService, DEMO_UID, DEMO_USER } from './demo.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly firestoreService = inject(FirestoreService);
  private readonly demo = inject(DemoService);

  // initialValue: null prevents undefined signal; catchError handles Firebase config errors
  private readonly firebaseUser = toSignal(
    authState(this.auth).pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  readonly isAuthenticated = computed(() =>
    this.demo.active() || this.firebaseUser() !== null,
  );

  readonly currentUid = computed(() =>
    this.demo.active() ? DEMO_UID : (this.firebaseUser()?.uid ?? null),
  );

  readonly currentEmail = computed(() =>
    this.demo.active() ? DEMO_USER.email : (this.firebaseUser()?.email ?? null),
  );

  async demoLogin(): Promise<void> {
    this.demo.activate();
    await this.router.navigateByUrl('/app/vehicles', { replaceUrl: true });
  }

  async register(email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const user: User = { id: cred.user.uid, email, isPro: false, createdAt: new Date() };
    await this.firestoreService.saveUser(user);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async signOut(): Promise<void> {
    this.demo.deactivate();
    try { await signOut(this.auth); } catch { /* not signed in */ }
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
