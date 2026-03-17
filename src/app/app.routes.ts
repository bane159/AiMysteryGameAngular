import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landing/landing').then(m => m.Landing)
      },
      {
        path: 'game',
        loadComponent: () => import('./pages/game/game').then(m => m.Game)
      },
      {
        path: 'game/:id',
        loadComponent: () => import('./pages/game/game').then(m => m.Game)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/account/account').then(m => m.Account)
      }
    ]
  }
];
