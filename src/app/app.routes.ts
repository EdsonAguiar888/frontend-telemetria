

import { Routes } from '@angular/router';

import { LayoutComponent } from './shared/components/layout/layout.component';

import { ImoveisComponent } from './features/imoveis/imoveis.component';
import { MedidoresComponent } from './features/medidores/medidores.component';
import { LeiturasComponent } from './features/leituras/leituras.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/login/login.component';

import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: '',
    component: LayoutComponent,

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      {
        path: 'imoveis',
        component: ImoveisComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'ADMIN'
        }
      },

      {
        path: 'medidores',
        component: MedidoresComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'ADMIN'
        }
      },

      {
        path: 'leituras',
        component: LeiturasComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'ADMIN'
        }
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];











// import { Routes } from '@angular/router';

// import { LayoutComponent } from './shared/components/layout/layout.component';

// import { ImoveisComponent } from './features/imoveis/imoveis.component';
// import { MedidoresComponent } from './features/medidores/medidores.component';
// import { LeiturasComponent } from './features/leituras/leituras.component';
// import { DashboardComponent } from './features/dashboard/dashboard.component';

// import { LoginComponent } from './features/login/login.component';

// export const routes: Routes = [

//   {
//     path: 'login',
//     component: LoginComponent
//   },

//   {
//     path: '', component: LayoutComponent, children: [
//       { path: '', redirectTo: 'imoveis', pathMatch: 'full' },
//       { path: 'imoveis', component: ImoveisComponent },
//       { path: 'medidores', component: MedidoresComponent },
//       { path: 'leituras', component: LeiturasComponent },
//       { path: 'dashboard', component: DashboardComponent }
//     ]
//   },

//   {
//     path: '**', redirectTo: 'imoveis'
//   }

// ];



