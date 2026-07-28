import { Injectable, signal } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';
import { MaintenanceLog } from '../models/maintenance-log.model';
import { ModificationLog } from '../models/modification-log.model';
import { RepairLog } from '../models/repair-log.model';
import { Reminder } from '../models/reminder.model';
import { User } from '../models/user.model';

export const DEMO_UID = 'demo-user-001';

const d = (daysAgo: number): Date => { const dt = new Date(); dt.setDate(dt.getDate() - daysAgo); return dt; };
const future = (days: number): Date => { const dt = new Date(); dt.setDate(dt.getDate() + days); return dt; };

export const DEMO_USER: User = {
  id: DEMO_UID, email: 'demo@vehiclemanager.app',
  name: 'Carlos García', birthDate: new Date(1990, 4, 12),
  photoURL: undefined, isPro: true, createdAt: d(365),
};

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-v1', userId: DEMO_UID, brand: 'BMW', model: 'Serie 3 320d',
    licensePlate: '1234 ABC', year: 2021, currentMileage: 47_200,
    photoURLs: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'],
    specs: { Motor: '2.0 TDI 190 cv', Transmisión: 'Automática 8v', Tracción: 'Trasera', Carrocería: 'Sedán', Color: 'Azul Crepúsculo', 'Consumo mixto': '5,2 L/100 km', 'Potencia (cv)': '190', 'Par (Nm)': '400', '0-100 km/h': '7,1 s' },
    createdAt: d(310),
  },
  {
    id: 'demo-v2', userId: DEMO_UID, brand: 'Toyota', model: 'GR86',
    licensePlate: '5678 DEF', year: 2023, currentMileage: 14_600,
    photoURLs: ['https://images.unsplash.com/photo-1611859266238-4b98091d9d9b?w=800&q=80'],
    specs: { Motor: '2.4 Boxer 234 cv', Transmisión: 'Manual 6v', Tracción: 'RWD', Carrocería: 'Coupé', Color: 'Rojo Ígneo', 'Consumo mixto': '9,6 L/100 km', 'Potencia (cv)': '234', '0-100 km/h': '6,3 s' },
    createdAt: d(180),
  },
  {
    id: 'demo-v3', userId: DEMO_UID, brand: 'Ford', model: 'Mustang GT',
    licensePlate: '9012 GHI', year: 2019, currentMileage: 81_400,
    photoURLs: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'],
    specs: { Motor: '5.0 V8 450 cv', Transmisión: 'Manual 6v', Tracción: 'RWD', Carrocería: 'Fastback', Color: 'Rojo Competición', 'Consumo mixto': '14,2 L/100 km', 'Potencia (cv)': '450', '0-100 km/h': '4,8 s' },
    createdAt: d(600),
  },
];

export const DEMO_MAINTENANCE: Record<string, MaintenanceLog[]> = {
  'demo-v1': [
    { id: 'dm1-1', vehicleId: 'demo-v1', date: d(18),  mileage: 46_000, type: 'Aceite',     cost: 94.90,  notes: 'Castrol Edge 5W-30 LL · filtro Mann',         attachmentURLs: [] },
    { id: 'dm1-2', vehicleId: 'demo-v1', date: d(95),  mileage: 42_000, type: 'Neumáticos', cost: 680.00, notes: 'Michelin Pilot Sport 5 × 4 ud.',               attachmentURLs: [] },
    { id: 'dm1-3', vehicleId: 'demo-v1', date: d(130), mileage: 40_000, type: 'Frenos',     cost: 345.00, notes: 'Pastillas Brembo + discos delanteros',          attachmentURLs: [] },
    { id: 'dm1-4', vehicleId: 'demo-v1', date: d(185), mileage: 37_000, type: 'ITV',        cost: 45.00,  notes: 'Favorable. Sin defectos',                      attachmentURLs: [] },
    { id: 'dm1-5', vehicleId: 'demo-v1', date: d(220), mileage: 35_000, type: 'Filtros',    cost: 62.00,  notes: 'Filtro aire + habitáculo + combustible',       attachmentURLs: [] },
    { id: 'dm1-6', vehicleId: 'demo-v1', date: d(370), mileage: 28_000, type: 'Aceite',     cost: 89.00,  notes: 'Cambio preventivo + revisión 30k',             attachmentURLs: [] },
  ],
  'demo-v2': [
    { id: 'dm2-1', vehicleId: 'demo-v2', date: d(22),  mileage: 14_000, type: 'Aceite',     cost: 85.00,  notes: 'Motul 8100 X-cess 5W-40 6L',                  attachmentURLs: [] },
    { id: 'dm2-2', vehicleId: 'demo-v2', date: d(60),  mileage: 12_000, type: 'Neumáticos', cost: 720.00, notes: 'Michelin Pilot Sport 4S × 4 ud.',              attachmentURLs: [] },
    { id: 'dm2-3', vehicleId: 'demo-v2', date: d(90),  mileage: 10_000, type: 'Aceite',     cost: 79.00,  notes: 'Revisión 10.000 km concesionario Toyota',      attachmentURLs: [] },
    { id: 'dm2-4', vehicleId: 'demo-v2', date: d(175), mileage:  5_000, type: 'Filtros',    cost: 45.00,  notes: 'Filtro aire + habitáculo revisión PDI',        attachmentURLs: [] },
  ],
  'demo-v3': [
    { id: 'dm3-1', vehicleId: 'demo-v3', date: d(14),  mileage: 80_000, type: 'Aceite',      cost: 110.00, notes: 'Pennzoil Platinum 5W-50 8L V8',               attachmentURLs: [] },
    { id: 'dm3-2', vehicleId: 'demo-v3', date: d(50),  mileage: 78_000, type: 'Bujías',      cost: 220.00, notes: 'NGK Iridium × 8 ud.',                        attachmentURLs: [] },
    { id: 'dm3-3', vehicleId: 'demo-v3', date: d(110), mileage: 74_000, type: 'Frenos',      cost: 520.00, notes: 'Brembo Sport 4 ruedas',                       attachmentURLs: [] },
    { id: 'dm3-4', vehicleId: 'demo-v3', date: d(200), mileage: 68_000, type: 'Refrigerante', cost: 95.00, notes: 'Ford Premium Gold',                           attachmentURLs: [] },
    { id: 'dm3-5', vehicleId: 'demo-v3', date: d(300), mileage: 60_000, type: 'ITV',         cost: 56.50, notes: 'Favorable con aviso leve en emisiones',        attachmentURLs: [] },
    { id: 'dm3-6', vehicleId: 'demo-v3', date: d(400), mileage: 52_000, type: 'Transmisión', cost: 380.00, notes: 'Cambio aceite caja y diferencial',            attachmentURLs: [] },
    { id: 'dm3-7', vehicleId: 'demo-v3', date: d(500), mileage: 44_000, type: 'Batería',     cost: 185.00, notes: 'Varta Silver Dynamic 80Ah',                  attachmentURLs: [] },
  ],
};

export const DEMO_MODIFICATIONS: Record<string, ModificationLog[]> = {
  'demo-v1': [
    { id: 'dmod1-1', vehicleId: 'demo-v1', category: 'Audio',      partName: 'Sistema Harman Kardon',  brand: 'Harman Kardon', cost: 890,   notes: '12 altavoces, upgrade de fábrica',        photoURLs: [], createdAt: d(90)  },
    { id: 'dmod1-2', vehicleId: 'demo-v1', category: 'Exterior',   partName: 'Llantas 19" M Sport',    brand: 'BMW OEM',       cost: 1_400, notes: 'Set 4 llantas + neumáticos incluidos',   photoURLs: [], createdAt: d(150) },
    { id: 'dmod1-3', vehicleId: 'demo-v1', category: 'Electrónica', partName: 'CarPlay inalámbrico',   brand: 'MMI Upgrade',   cost: 189,   notes: 'Adaptador plug & play',                  photoURLs: [], createdAt: d(60)  },
  ],
  'demo-v2': [
    { id: 'dmod2-1', vehicleId: 'demo-v2', category: 'Suspensión',  partName: 'Muelles Eibach Pro-Kit', brand: 'Eibach',       cost: 450,   notes: 'Bajada 25 mm',                          photoURLs: [], createdAt: d(40)  },
    { id: 'dmod2-2', vehicleId: 'demo-v2', category: 'Escape',      partName: 'Cat-back HKS',          brand: 'HKS',          cost: 1_250, notes: 'Sonido deportivo +8 cv',                 photoURLs: [], createdAt: d(70)  },
    { id: 'dmod2-3', vehicleId: 'demo-v2', category: 'Aerodinámica', partName: 'Alerón TRD',           brand: 'Toyota TRD',   cost: 580,   notes: 'Original importado Japón',               photoURLs: [], createdAt: d(100) },
    { id: 'dmod2-4', vehicleId: 'demo-v2', category: 'Interior',    partName: 'Volante Momo Veloce',   brand: 'Momo',         cost: 320,   notes: '350mm + cubo adaptador',                 photoURLs: [], createdAt: d(55)  },
    { id: 'dmod2-5', vehicleId: 'demo-v2', category: 'Motor',       partName: 'Filtro K&N',            brand: 'K&N',          cost: 95,    notes: 'Panel replacement',                      photoURLs: [], createdAt: d(30)  },
  ],
  'demo-v3': [
    { id: 'dmod3-1', vehicleId: 'demo-v3', category: 'Motor',      partName: 'Reprogramación ECU',    brand: 'Livernois',    cost: 750,   notes: 'Stage 1: +45 cv, +60 Nm',               photoURLs: [], createdAt: d(120) },
    { id: 'dmod3-2', vehicleId: 'demo-v3', category: 'Escape',     partName: 'Escape Borla ATAK',     brand: 'Borla',        cost: 1_800, notes: 'Cat-back V8',                            photoURLs: [], createdAt: d(200) },
    { id: 'dmod3-3', vehicleId: 'demo-v3', category: 'Frenos',     partName: 'Kit Brembo 6p',         brand: 'Brembo',       cost: 2_400, notes: '6 pistones delante, 4 detrás',           photoURLs: [], createdAt: d(250) },
    { id: 'dmod3-4', vehicleId: 'demo-v3', category: 'Suspensión', partName: 'Coilovers KW V3',       brand: 'KW',           cost: 1_950, notes: 'Altura y amortiguación regulable',       photoURLs: [], createdAt: d(280) },
    { id: 'dmod3-5', vehicleId: 'demo-v3', category: 'Interior',   partName: 'Asientos Recaro SPG-X', brand: 'Recaro',       cost: 2_100, notes: 'Arnés y anclaje OEM',                   photoURLs: [], createdAt: d(350) },
  ],
};

export const DEMO_REPAIRS: Record<string, RepairLog[]> = {
  'demo-v1': [
    { id: 'dr1-1', vehicleId: 'demo-v1', date: d(45),  mileage: 44_500, description: 'Rayada puerta trasera derecha',    workshop: 'Taller Chapista Hermanos Ruiz',  cost: 380,   isInsuranceClaim: false, notes: 'Roce en parking, pagado de bolsillo', createdAt: d(45)  },
    { id: 'dr1-2', vehicleId: 'demo-v1', date: d(280), mileage: 32_000, description: 'Choque frontal leve — para-golpes', workshop: 'Carrocerías Norte S.L.',         cost: 1_200, isInsuranceClaim: true,  notes: 'Tramitado con seguro, franquicia pagada', createdAt: d(280) },
  ],
  'demo-v2': [
    { id: 'dr2-1', vehicleId: 'demo-v2', date: d(30), mileage: 13_800, description: 'Arañazo paragolpes trasero',        workshop: 'Autoservicio García',            cost: 150,   isInsuranceClaim: false, notes: 'Pequeño roce en parking', createdAt: d(30) },
  ],
  'demo-v3': [
    { id: 'dr3-1', vehicleId: 'demo-v3', date: d(60),  mileage: 79_000, description: 'Sustitución luna trasera',         workshop: 'Carglass',                       cost: 340,   isInsuranceClaim: true,  notes: 'Piedra en autovía, cubierto por seguro', createdAt: d(60)  },
    { id: 'dr3-2', vehicleId: 'demo-v3', date: d(150), mileage: 74_500, description: 'Reparación carrocería lateral',    workshop: 'Carrocerías Martínez',           cost: 950,   isInsuranceClaim: false, notes: 'Vándalo en estacionamiento', createdAt: d(150) },
    { id: 'dr3-3', vehicleId: 'demo-v3', date: d(420), mileage: 51_000, description: 'Colisión trasera menor',           workshop: 'Taller Oficial Ford',            cost: 2_100, isInsuranceClaim: true,  notes: 'Semáforo, tramitado con seguro contrario', createdAt: d(420) },
  ],
};

export const DEMO_REMINDERS: Record<string, Reminder[]> = {
  'demo-v1': [
    { id: 'dr1-1', vehicleId: 'demo-v1', title: 'Cambio de aceite',           dueMileage: 56_000,                  isTriggered: false, createdAt: d(18)  },
    { id: 'dr1-2', vehicleId: 'demo-v1', title: 'Renovación ITV',             dueDate: future(62),                 isTriggered: false, createdAt: d(185) },
    { id: 'dr1-3', vehicleId: 'demo-v1', title: 'Revisión filtro habitáculo', dueMileage: 55_000,                  isTriggered: false, createdAt: d(90)  },
    { id: 'dr1-4', vehicleId: 'demo-v1', title: 'Seguro vencimiento',         dueDate: future(28),                 isTriggered: false, createdAt: d(30)  },
  ],
  'demo-v2': [
    { id: 'dr2-1', vehicleId: 'demo-v2', title: 'Revisión 20.000 km',        dueMileage: 20_000,                  isTriggered: false, createdAt: d(60)  },
    { id: 'dr2-2', vehicleId: 'demo-v2', title: 'ITV (1ª vez)',              dueDate: future(180),                 isTriggered: false, createdAt: d(10)  },
  ],
  'demo-v3': [
    { id: 'dr3-1', vehicleId: 'demo-v3', title: 'Cambio de aceite V8',       dueMileage: 90_000,                  isTriggered: false, createdAt: d(14)  },
    { id: 'dr3-2', vehicleId: 'demo-v3', title: 'Revisión frenos Brembo',    dueDate: future(45),                 isTriggered: false, createdAt: d(250) },
    { id: 'dr3-3', vehicleId: 'demo-v3', title: 'Seguro — renovación anual', dueDate: future(15),                 isTriggered: false, createdAt: d(350) },
  ],
};

@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly KEY = 'vm_demo';
  readonly active = signal(sessionStorage.getItem(this.KEY) === '1');

  activate(): void   { sessionStorage.setItem(this.KEY, '1'); this.active.set(true);  }
  deactivate(): void { sessionStorage.removeItem(this.KEY);   this.active.set(false); }
}
