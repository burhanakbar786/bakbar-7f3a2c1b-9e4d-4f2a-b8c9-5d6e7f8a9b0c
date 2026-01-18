import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'signin',
    loadComponent: () =>
      import('./components/signin/signin.component').then((m) => m.SigninComponent),
  },
  {
    path: 'login',
    redirectTo: '/signin',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/task-board/task-board.component').then(
        (m) => m.TaskBoardComponent,
      ),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
