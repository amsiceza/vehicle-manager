# VehicleManager Web — Angular + Ionic + Firebase

Versión web/PWA de VehicleManager. Misma lógica de negocio que la app iOS, corriendo en cualquier navegador moderno.

**Stack:** Angular 18 · Ionic 8 · Firebase (Auth + Firestore + Storage) · jsPDF

**Tema:** Liquid Glass — inspirado en Apple iOS 26 / visionOS (glassmorphism, backdrop blur, ambient orbs, gradientes líquidos).

---

## Levantar en local

### 1. Instalar dependencias

```bash
cd ~/Documents/VehicleManagerWeb
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com) → tu proyecto → Configuración del proyecto → Tus apps → Web
2. Copia el objeto `firebaseConfig`
3. Pégalo en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIza...',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto',
    storageBucket: 'tu-proyecto.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
  },
};
```

> El mismo proyecto Firebase que la app iOS — comparten Firestore y Auth.

### 3. Lanzar el servidor de desarrollo

```bash
npm start
# Abre http://localhost:4200
```

---

## Build de producción

```bash
npm run build
# La carpeta www/ contiene los estáticos listos para deploy
```

Para desplegar como PWA en Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # carpeta pública: www
firebase deploy
```

---

## Reglas de Firestore

Las mismas del proyecto iOS. Cópialas en Firebase Console → Firestore → Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /{col}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Estructura

```
src/
├── theme/
│   └── variables.scss        ← Sistema completo Liquid Glass (tokens, overrides Ionic)
├── global.scss               ← Clases utilitarias glass-card, stat-tile, animaciones
├── app/
│   ├── core/
│   │   ├── models/           user · vehicle · maintenanceLog · modificationLog · reminder
│   │   ├── services/         auth · firestore · storage · pdf
│   │   └── guards/           authGuard · publicGuard
│   ├── domain/
│   │   └── use-cases/        addVehicle · checkProLimit
│   ├── features/
│   │   ├── auth/             login · register  (glass form + ambient orbs)
│   │   ├── tabs/             ion-tabs shell
│   │   ├── vehicles/         vehicle-list (grid) · vehicle-detail (segmented tabs) · add-edit
│   │   ├── reminders/        reminder-list (todos los vehículos)
│   │   └── profile/          datos de cuenta + sign out
│   └── shared/
│       └── components/       loading · empty-state · vehicle-card · paywall
```

---

## Diseño Liquid Glass

El tema reproduce el aesthetic de **Apple iOS 26** usando CSS puro:

| Elemento | Técnica CSS |
|---|---|
| Superficies | `backdrop-filter: blur(28px) saturate(200%)` + `rgba(255,255,255,0.07)` |
| Bordes | `1px solid rgba(255,255,255,0.14)` + highlight `inset 0 1px 0 rgba(255,255,255,0.18)` |
| Glow de accentos | `box-shadow: 0 0 40px rgba(0,122,255,0.28)` |
| Fondo ambient | `radial-gradient` con orbs animadas filtradas con `blur(80px)` |
| Animaciones | `cubic-bezier(0.16,1,0.3,1)` — spring suave de Apple |
| Tab bar | `backdrop-filter` + `border-top` glass |
| Modals / sheets | `rgba(10,10,20,0.94)` + blur lg + borde brillante |

---

## Reglas de negocio implementadas

| Regla | Fichero |
|---|---|
| Límite 3 vehículos (free) | `add-vehicle.use-case.ts` |
| Paywall modal | `paywall.component` + `vehicle-list.page` |
| PDF solo Pro | `vehicle-detail.page.ts → exportPdf()` |
| Auth guard rutas | `auth.guard.ts` |
| Compresión imágenes | `storage.service.ts → compress()` |
