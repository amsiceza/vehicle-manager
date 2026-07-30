import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/app/vehicles', pathMatch: 'full' },

  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage),
        canActivate: [publicGuard],
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.page').then(m => m.RegisterPage),
        canActivate: [publicGuard],
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  {
    path: 'app',
    loadComponent: () => import('./features/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'vehicles',
        loadComponent: () => import('./features/vehicles/vehicle-list/vehicle-list.page').then(m => m.VehicleListPage),
      },
      {
        path: 'reminders',
        loadComponent: () => import('./features/reminders/reminder-list/reminder-list.page').then(m => m.ReminderListPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
      },
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
    ],
  },

  {
    path: 'vehicles/:id',
    loadComponent: () => import('./features/vehicles/vehicle-detail-modal/vehicle-detail-modal.component').then(m => m.VehicleDetailModalComponent),
    canActivate: [authGuard],
  },
  {
    path: 'vehicles/new',
    loadComponent: () => import('./features/vehicles/add-edit-vehicle/add-edit-vehicle.page').then(m => m.AddEditVehiclePage),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: '/app/vehicles' },
];
