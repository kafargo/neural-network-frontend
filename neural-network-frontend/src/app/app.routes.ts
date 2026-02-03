import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/about', pathMatch: 'full' },
  { 
    path: 'about', 
    loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent)
  },
  { 
    path: 'create', 
    loadComponent: () => import('./components/network-config/network-config.component').then(m => m.NetworkConfigComponent)
  },
  { 
    path: 'train', 
    loadComponent: () => import('./components/network-training/network-training.component').then(m => m.NetworkTrainingComponent)
  },
  { 
    path: 'test', 
    loadComponent: () => import('./components/network-test/network-test.component').then(m => m.NetworkTestComponent)
  },
  { path: '**', redirectTo: '/about' } // Wildcard route for 404 pages
];
