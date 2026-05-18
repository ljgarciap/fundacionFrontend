import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  user: any = null;
  loading = false;
  activeTab = 'global';

  // Global summary
  resumen: any = {};
  loadingResumen = false;

  // Reingresos
  reingresos: any[] = [];
  reingresosStats: any = {};
  loadingReingresos = false;
  filtroDesdeR = '';
  filtroHastaR = '';
  filtroSede   = '';
  searchReingresos = '';

  // Psicología
  sesiones: any[] = [];
  porProfesional: any[] = [];
  porMes: any[] = [];
  loadingPsico = false;
  filtroDesdePsico = '';
  filtroHastaPsico = '';
  filtroResidentePsico = '';
  residents: any[] = [];

  // Permisos
  permisosData: any[] = [];
  permisosStats: any = {};
  loadingPermisos = false;
  filtroDesdeP = '';
  filtroHastaP = '';

  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResumen();
    this.loadResidents();
  }

  // ─── Tab navigation ────────────────────────────────────────
  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'reingresos' && !this.reingresos.length) this.loadReingresos();
    if (tab === 'psicologia' && !this.sesiones.length)  this.loadPsicologia();
    if (tab === 'permisos'   && !this.permisosData.length) this.loadPermisos();
  }

  // ─── Global ────────────────────────────────────────────────
  loadResumen() {
    this.loadingResumen = true;
    this.api.get('reportes/resumen').subscribe({
      next: (res: any) => { this.resumen = res; this.loadingResumen = false; },
      error: () => this.loadingResumen = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => this.residents = res,
      error: () => {}
    });
  }

  // ─── Reingresos ────────────────────────────────────────────
  loadReingresos() {
    this.loadingReingresos = true;
    const params: any = {};
    if (this.filtroSede)   params['sede']  = this.filtroSede;
    if (this.filtroDesdeR) params['desde'] = this.filtroDesdeR;
    if (this.filtroHastaR) params['hasta'] = this.filtroHastaR;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/reingresos${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.reingresos = res.data;
        this.reingresosStats = res.stats;
        this.loadingReingresos = false;
      },
      error: () => this.loadingReingresos = false
    });
  }

  get filteredReingresos() {
    if (!this.searchReingresos) return this.reingresos;
    const q = this.searchReingresos.toLowerCase();
    return this.reingresos.filter(r =>
      r.nombresr?.toLowerCase().includes(q) ||
      r.apellidosr?.toLowerCase().includes(q) ||
      r.documentor?.toString().includes(q) ||
      r.nomfund?.toLowerCase().includes(q)
    );
  }

  // ─── Psicología ────────────────────────────────────────────
  loadPsicologia() {
    this.loadingPsico = true;
    const params: any = {};
    if (this.filtroResidentePsico) params['idresidentes'] = this.filtroResidentePsico;
    if (this.filtroDesdePsico)     params['desde'] = this.filtroDesdePsico;
    if (this.filtroHastaPsico)     params['hasta'] = this.filtroHastaPsico;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/psicologia${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.sesiones = res.data;
        this.porProfesional = res.por_profesional;
        this.porMes = res.por_mes;
        this.loadingPsico = false;
      },
      error: () => this.loadingPsico = false
    });
  }

  // ─── Permisos report ───────────────────────────────────────
  loadPermisos() {
    this.loadingPermisos = true;
    const params: any = {};
    if (this.filtroDesdeP) params['desde'] = this.filtroDesdeP;
    if (this.filtroHastaP) params['hasta'] = this.filtroHastaP;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/permisos${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.permisosData = res.data;
        this.permisosStats = { total: res.total, fuera: res.fuera, retornos: res.retornos };
        this.loadingPermisos = false;
      },
      error: () => this.loadingPermisos = false
    });
  }

  estaFuera(p: any): boolean {
    return !p.fechaingreso || p.fechaingreso === '0000-00-00';
  }

  switchRole(newRole: string) {
    this.auth.switchActiveRole(newRole);
    window.location.reload();
  }

    toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
