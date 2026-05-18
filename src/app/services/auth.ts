import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Api } from './api';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private api: Api) { }

  login(credentials: any): Observable<any> {
    return this.api.post('login', credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.api.post('logout', {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  switchActiveRole(newRole: string) {
    const user = this.getUser();
    if (user && user.roles && user.roles.includes(newRole)) {
      user.role = newRole;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /* ─────────────────────────────────────────────────────────
   * ROLE-BASED ACCESS CONTROL (RBAC)
   * Enforces module access depending on user role
   * ───────────────────────────────────────────────────────── */
  canAccess(module: string): boolean {
    const user = this.getUser();
    if (!user || !user.role) return false;
    const role = user.role.toUpperCase();

    // Super Administrators have access to all modules
    if (role === 'SADMIN' || role === 'ADMIN' || role === 'BDA') {
      return true;
    }

    switch (module) {
      case 'dashboard':
        return true; // Everyone can see the dashboard main view

      case 'ingreso':
        return role === 'PLANTA';

      case 'ahorro':
      case 'tienda':
      case 'uniformes':
      case 'diezmos':
      case 'almuerzos':
        return role === 'CAJERO';

      case 'psicologia':
      case 'terapias':
      case 'agenda':
      case 'practicantes':
        return role === 'PSICOLOGO' || role === 'PRACTICANTE' || role === 'TERAPEUTA_G' || role === 'PSICO';

      case 'permisos':
      case 'minuta':
      case 'bitacora':
        return role === 'MINUTA' || role === 'PLANTA' || role === 'PSICOLOGO' || role === 'PRACTICANTE' || role === 'TERAPEUTA_G' || role === 'PSICO' || role === 'CAJERO';

      case 'contabilidad':
      case 'compras':
      case 'conceptos':
      case 'reportes':
        return false; // Restricted to admin profiles only

      default:
        return false;
    }
  }
}
