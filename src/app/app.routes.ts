import { Routes } from '@angular/router';
import { TesteImoveisComponent } from './features/teste-imoveis.component';
import { TesteMedidoresComponent } from './features/teste-medidores.component';
import { TesteLeiturasComponent } from './features/teste-leituras.component';
import { ImoveisComponent } from './features/imoveis/imoveis.component';
import { MedidoresComponent } from './features/medidores/medidores.component';

export const routes: Routes = [
    // { path: '', component: TesteImoveisComponent }     testes
    // { path: '', component: TesteMedidoresComponent }   testes
    // { path: '', component: TesteLeiturasComponent }    testes

    { path: '', redirectTo: 'imoveis', pathMatch: 'full' },
    { path: 'imoveis', component: ImoveisComponent },
    { path: 'medidores', component: MedidoresComponent },
    { path: '**', redirectTo: 'imoveis' }
];
