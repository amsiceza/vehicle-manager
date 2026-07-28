import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, Timestamp,
} from '@angular/fire/firestore';
import {
  DemoService, DEMO_UID, DEMO_USER, DEMO_VEHICLES,
  DEMO_MAINTENANCE, DEMO_MODIFICATIONS, DEMO_REPAIRS, DEMO_REMINDERS,
} from './demo.service';
import { User } from '../models/user.model';
import { Vehicle } from '../models/vehicle.model';
import { MaintenanceLog } from '../models/maintenance-log.model';
import { ModificationLog } from '../models/modification-log.model';
import { RepairLog } from '../models/repair-log.model';
import { Reminder } from '../models/reminder.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FsData = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly fs = inject(Firestore);
  private readonly demo = inject(DemoService);

  // In-memory demo stores
  private demoVehicles = [...DEMO_VEHICLES];
  private demoMaint = structuredClone(DEMO_MAINTENANCE);
  private demoMods  = structuredClone(DEMO_MODIFICATIONS);
  private demoRepairs = structuredClone(DEMO_REPAIRS);
  private demoReminders = structuredClone(DEMO_REMINDERS);

  // ── User ────────────────────────────────────────────────────
  async fetchUser(id: string): Promise<User | null> {
    if (this.demo.active()) return id === DEMO_UID ? { ...DEMO_USER } : null;
    const snap = await getDoc(doc(this.fs, 'users', id));
    return snap.exists() ? this.toModel<User>(snap.id, snap.data() as FsData) : null;
  }
  async saveUser(u: User): Promise<void> {
    if (this.demo.active()) return;
    await setDoc(doc(this.fs, 'users', u.id), this.toFs(u));
  }
  async updateUser(u: Partial<User> & { id: string }): Promise<void> {
    if (this.demo.active()) return;
    await updateDoc(doc(this.fs, 'users', u.id), this.toFs(u));
  }

  // ── Vehicles ────────────────────────────────────────────────
  async fetchVehicles(userId: string): Promise<Vehicle[]> {
    if (this.demo.active()) return this.demoVehicles.filter(v => v.userId === userId);
    const snap = await getDocs(query(collection(this.fs, 'vehicles'), where('userId', '==', userId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => this.toModel<Vehicle>(d.id, d.data() as FsData));
  }
  async saveVehicle(v: Vehicle): Promise<void> {
    if (this.demo.active()) { this.demoVehicles.unshift(v); return; }
    await setDoc(doc(this.fs, 'vehicles', v.id), this.toFs(v));
  }
  async updateVehicle(v: Partial<Vehicle> & { id: string }): Promise<void> {
    if (this.demo.active()) { const i = this.demoVehicles.findIndex(x => x.id === v.id); if (i >= 0) this.demoVehicles[i] = { ...this.demoVehicles[i], ...v }; return; }
    await updateDoc(doc(this.fs, 'vehicles', v.id), this.toFs(v));
  }
  async deleteVehicle(id: string): Promise<void> {
    if (this.demo.active()) { this.demoVehicles = this.demoVehicles.filter(v => v.id !== id); return; }
    await deleteDoc(doc(this.fs, 'vehicles', id));
  }

  // ── Maintenance ─────────────────────────────────────────────
  async fetchMaintenanceLogs(vehicleId: string): Promise<MaintenanceLog[]> {
    if (this.demo.active()) return this.demoMaint[vehicleId] ?? [];
    const snap = await getDocs(query(collection(this.fs, 'maintenanceLogs'), where('vehicleId', '==', vehicleId), orderBy('date', 'desc')));
    return snap.docs.map(d => this.toModel<MaintenanceLog>(d.id, d.data() as FsData));
  }
  async saveMaintenanceLog(log: MaintenanceLog): Promise<void> {
    if (this.demo.active()) { this.demoMaint[log.vehicleId] = [log, ...(this.demoMaint[log.vehicleId] ?? [])]; return; }
    await setDoc(doc(this.fs, 'maintenanceLogs', log.id), this.toFs(log));
  }
  async deleteMaintenanceLog(id: string): Promise<void> {
    if (this.demo.active()) { for (const k of Object.keys(this.demoMaint)) this.demoMaint[k] = this.demoMaint[k].filter(l => l.id !== id); return; }
    await deleteDoc(doc(this.fs, 'maintenanceLogs', id));
  }

  // ── Modifications ───────────────────────────────────────────
  async fetchModifications(vehicleId: string): Promise<ModificationLog[]> {
    if (this.demo.active()) return this.demoMods[vehicleId] ?? [];
    const snap = await getDocs(query(collection(this.fs, 'modifications'), where('vehicleId', '==', vehicleId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => this.toModel<ModificationLog>(d.id, d.data() as FsData));
  }
  async saveModification(mod: ModificationLog): Promise<void> {
    if (this.demo.active()) { this.demoMods[mod.vehicleId] = [mod, ...(this.demoMods[mod.vehicleId] ?? [])]; return; }
    await setDoc(doc(this.fs, 'modifications', mod.id), this.toFs(mod));
  }
  async deleteModification(id: string): Promise<void> {
    if (this.demo.active()) { for (const k of Object.keys(this.demoMods)) this.demoMods[k] = this.demoMods[k].filter(m => m.id !== id); return; }
    await deleteDoc(doc(this.fs, 'modifications', id));
  }

  // ── Repairs ─────────────────────────────────────────────────
  async fetchRepairLogs(vehicleId: string): Promise<RepairLog[]> {
    if (this.demo.active()) return this.demoRepairs[vehicleId] ?? [];
    const snap = await getDocs(query(collection(this.fs, 'repairLogs'), where('vehicleId', '==', vehicleId), orderBy('date', 'desc')));
    return snap.docs.map(d => this.toModel<RepairLog>(d.id, d.data() as FsData));
  }
  async saveRepairLog(r: RepairLog): Promise<void> {
    if (this.demo.active()) { this.demoRepairs[r.vehicleId] = [r, ...(this.demoRepairs[r.vehicleId] ?? [])]; return; }
    await setDoc(doc(this.fs, 'repairLogs', r.id), this.toFs(r));
  }
  async deleteRepairLog(id: string): Promise<void> {
    if (this.demo.active()) { for (const k of Object.keys(this.demoRepairs)) this.demoRepairs[k] = this.demoRepairs[k].filter(r => r.id !== id); return; }
    await deleteDoc(doc(this.fs, 'repairLogs', id));
  }

  // ── Reminders ───────────────────────────────────────────────
  async fetchReminders(vehicleId: string): Promise<Reminder[]> {
    if (this.demo.active()) return this.demoReminders[vehicleId] ?? [];
    const snap = await getDocs(query(collection(this.fs, 'reminders'), where('vehicleId', '==', vehicleId), orderBy('createdAt', 'asc')));
    return snap.docs.map(d => this.toModel<Reminder>(d.id, d.data() as FsData));
  }
  async saveReminder(r: Reminder): Promise<void> {
    if (this.demo.active()) { this.demoReminders[r.vehicleId] = [...(this.demoReminders[r.vehicleId] ?? []), r]; return; }
    await setDoc(doc(this.fs, 'reminders', r.id), this.toFs(r));
  }
  async updateReminder(r: Partial<Reminder> & { id: string }): Promise<void> {
    if (this.demo.active()) { for (const k of Object.keys(this.demoReminders)) { const i = this.demoReminders[k].findIndex(x => x.id === r.id); if (i >= 0) this.demoReminders[k][i] = { ...this.demoReminders[k][i], ...r }; } return; }
    await updateDoc(doc(this.fs, 'reminders', r.id), this.toFs(r));
  }
  async deleteReminder(id: string): Promise<void> {
    if (this.demo.active()) { for (const k of Object.keys(this.demoReminders)) this.demoReminders[k] = this.demoReminders[k].filter(r => r.id !== id); return; }
    await deleteDoc(doc(this.fs, 'reminders', id));
  }

  // ── Helpers ─────────────────────────────────────────────────
  private toFs(obj: object): FsData {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v instanceof Date ? Timestamp.fromDate(v) : v]));
  }
  private toModel<T>(id: string, data: FsData): T {
    return { ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v instanceof Timestamp ? v.toDate() : v])), id } as T;
  }
}
