import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Ingreso } from './components/ingreso/ingreso';
import { Pagos } from './components/pagos/pagos';
import { Psicologia } from './components/psicologia/psicologia';
import { Agenda } from './components/agenda/agenda';
import { Tienda } from './components/tienda/tienda';
import { Reportes } from './components/reportes/reportes';
import { Biometricos } from './components/biometricos/biometricos';
import { Bitacora } from './components/bitacora/bitacora';
import { Ahorro } from './components/ahorro/ahorro';
import { Minuta } from './components/minuta/minuta';
import { Contabilidad } from './components/contabilidad/contabilidad';
import { Compras } from './components/compras/compras';
import { ComprasDetalle } from './components/compras/compras-detalle';
import { Servicios } from './components/servicios/servicios';
import { Diezmos } from './components/diezmos/diezmos';
import { Practicantes } from './components/practicantes/practicantes';
import { Conceptos } from './components/conceptos/conceptos';
import { Permisos } from './components/permisos/permisos';
import { Terapias } from './components/terapias/terapias';
import { Usuarios } from './components/usuarios/usuarios';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'ingreso', component: Ingreso },
    { path: 'pagos', component: Pagos },
    { path: 'psicologia', redirectTo: '/terapias', pathMatch: 'full' },
    { path: 'agenda', component: Agenda },
    { path: 'tienda', component: Tienda },
    { path: 'reportes', component: Reportes },
    { path: 'biometricos/:id', component: Biometricos },
    { path: 'bitacora', component: Bitacora },
    { path: 'ahorro', component: Ahorro },
    { path: 'minuta', component: Minuta },
    { path: 'contabilidad', component: Contabilidad },
    { path: 'compras', component: Compras },
    { path: 'compras/:id', component: ComprasDetalle },
    { path: 'servicios', component: Servicios },
    { path: 'uniformes', redirectTo: '/servicios', pathMatch: 'full' },
    { path: 'diezmos', component: Diezmos },
    { path: 'almuerzos', redirectTo: '/servicios', pathMatch: 'full' },
    { path: 'practicantes', component: Practicantes },
    { path: 'conceptos', component: Conceptos },
    { path: 'permisos', component: Permisos },
    { path: 'terapias', component: Terapias },
    { path: 'usuarios', component: Usuarios },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
