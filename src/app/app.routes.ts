import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landing/landing').then(m => m.Landing)
      },
      // {
      //   path: 'game',
      //   canActivate: [authGuard],
      //   loadComponent: () => import('./pages/game/game').then(m => m.Game)
      // },
      {
        path: 'game/:id',
        canActivate: [authGuard],
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
        canActivate: [authGuard],
        loadComponent: () => import('./pages/account/account').then(m => m.Account)
      },
      {
        path: '**',
        redirectTo: ''
      },
    ]
  }
];
