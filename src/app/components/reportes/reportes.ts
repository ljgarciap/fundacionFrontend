import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  reingresosStats: any = { total: 0, activos: 0, inactivos: 0, reingresantes: 0 };
  loadingReingresos = false;
  reingresosLoaded = false;
  filtroDesdeR = '';
  filtroHastaR = '';
  filtroSede   = '';
  searchReingresos = '';
  reingresosCurrentPage = 1;
  reingresosPageSize = 10;

  // Psicología
  sesiones: any[] = [];
  porProfesional: any[] = [];
  porMes: any[] = [];
  loadingPsico = false;
  psicoLoaded = false;
  filtroDesdePsico = '';
  filtroHastaPsico = '';
  filtroResidentePsico = '';
  residents: any[] = [];
  psicoCurrentPage = 1;
  psicoPageSize = 10;

  // Permisos
  permisosData: any[] = [];
  permisosStats: any = { total: 0, fuera: 0, retornos: 0 };
  loadingPermisos = false;
  permisosLoaded = false;
  filtroDesdeP = '';
  filtroHastaP = '';
  permisosCurrentPage = 1;
  permisosPageSize = 10;

  constructor(
    private api: Api, 
    private auth: Auth, 
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResumen();
    this.loadResidents();
  }

  // ─── Tab navigation ────────────────────────────────────────
  setTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
    if (tab === 'reingresos' && !this.reingresosLoaded) this.loadReingresos();
    if (tab === 'psicologia' && !this.psicoLoaded)       this.loadPsicologia();
    if (tab === 'permisos'   && !this.permisosLoaded)      this.loadPermisos();
  }

  // ─── Global ────────────────────────────────────────────────
  loadResumen() {
    this.loadingResumen = true;
    this.cdr.detectChanges();
    this.api.get('reportes/resumen').subscribe({
      next: (res: any) => { 
        this.resumen = res || {}; 
        this.loadingResumen = false; 
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.loadingResumen = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => {
        this.residents = res || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Reingresos ────────────────────────────────────────────
  loadReingresos() {
    this.reingresosCurrentPage = 1;
    this.loadingReingresos = true;
    this.cdr.detectChanges();
    const params: any = {};
    if (this.filtroSede)   params['sede']  = this.filtroSede;
    if (this.filtroDesdeR) params['desde'] = this.filtroDesdeR;
    if (this.filtroHastaR) params['hasta'] = this.filtroHastaR;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/reingresos${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.reingresos = res.data || [];
        this.reingresosStats = res.stats || { total: 0, activos: 0, inactivos: 0, reingresantes: 0 };
        this.loadingReingresos = false;
        this.reingresosLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingReingresos = false;
        this.reingresosLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  selectedReingreso: any = null;

  verMotivo(reingreso: any) {
    this.selectedReingreso = reingreso;
    this.cdr.detectChanges();
  }

  closeReingresoModal() {
    this.selectedReingreso = null;
    this.cdr.detectChanges();
  }

  selectedSesion: any = null;

  verSesion(sesion: any) {
    this.selectedSesion = sesion;
    this.cdr.detectChanges();
  }

  closeSesionModal() {
    this.selectedSesion = null;
    this.cdr.detectChanges();
  }

  get filteredReingresos() {
    if (!this.reingresos) return [];
    if (!this.searchReingresos) return this.reingresos;
    const q = this.searchReingresos.toLowerCase();
    return this.reingresos.filter(r =>
      r.nombresr?.toLowerCase().includes(q) ||
      r.apellidosr?.toLowerCase().includes(q) ||
      r.documentor?.toString().includes(q) ||
      r.nomfund?.toLowerCase().includes(q)
    );
  }

  getPaginatedReingresos() {
    const filtered = this.filteredReingresos;
    const totalPages = Math.ceil(filtered.length / this.reingresosPageSize);
    if (this.reingresosCurrentPage > totalPages && totalPages > 0) {
      this.reingresosCurrentPage = totalPages;
    }
    const startIndex = (this.reingresosCurrentPage - 1) * this.reingresosPageSize;
    return filtered.slice(startIndex, startIndex + this.reingresosPageSize);
  }

  totalReingresosPages() {
    return Math.ceil(this.filteredReingresos.length / this.reingresosPageSize);
  }

  changeReingresosPage(page: number) {
    if (page >= 1 && page <= this.totalReingresosPages()) {
      this.reingresosCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  // ─── Psicología ────────────────────────────────────────────
  loadPsicologia() {
    this.psicoCurrentPage = 1;
    this.loadingPsico = true;
    this.cdr.detectChanges();
    const params: any = {};
    if (this.filtroResidentePsico) params['idresidentes'] = this.filtroResidentePsico;
    if (this.filtroDesdePsico)     params['desde'] = this.filtroDesdePsico;
    if (this.filtroHastaPsico)     params['hasta'] = this.filtroHastaPsico;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/psicologia${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.sesiones = res.data || [];
        this.porProfesional = res.por_profesional || [];
        this.porMes = res.por_mes || [];
        this.loadingPsico = false;
        this.psicoLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPsico = false;
        this.psicoLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  getPaginatedPsicologia() {
    const data = this.sesiones;
    const totalPages = Math.ceil(data.length / this.psicoPageSize);
    if (this.psicoCurrentPage > totalPages && totalPages > 0) {
      this.psicoCurrentPage = totalPages;
    }
    const startIndex = (this.psicoCurrentPage - 1) * this.psicoPageSize;
    return data.slice(startIndex, startIndex + this.psicoPageSize);
  }

  totalPsicoPages() {
    return Math.ceil(this.sesiones.length / this.psicoPageSize);
  }

  changePsicoPage(page: number) {
    if (page >= 1 && page <= this.totalPsicoPages()) {
      this.psicoCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  // ─── Permisos report ───────────────────────────────────────
  loadPermisos() {
    this.permisosCurrentPage = 1;
    this.loadingPermisos = true;
    this.cdr.detectChanges();
    const params: any = {};
    if (this.filtroDesdeP) params['desde'] = this.filtroDesdeP;
    if (this.filtroHastaP) params['hasta'] = this.filtroHastaP;
    const qs = new URLSearchParams(params).toString();
    this.api.get(`reportes/permisos${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        this.permisosData = res.data || [];
        this.permisosStats = { 
          total: res.total || 0, 
          fuera: res.fuera || 0, 
          retornos: res.retornos || 0 
        };
        this.loadingPermisos = false;
        this.permisosLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPermisos = false;
        this.permisosLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  getPaginatedPermisos() {
    const data = this.permisosData;
    const totalPages = Math.ceil(data.length / this.permisosPageSize);
    if (this.permisosCurrentPage > totalPages && totalPages > 0) {
      this.permisosCurrentPage = totalPages;
    }
    const startIndex = (this.permisosCurrentPage - 1) * this.permisosPageSize;
    return data.slice(startIndex, startIndex + this.permisosPageSize);
  }

  totalPermisosPages() {
    return Math.ceil(this.permisosData.length / this.permisosPageSize);
  }

  changePermisosPage(page: number) {
    if (page >= 1 && page <= this.totalPermisosPages()) {
      this.permisosCurrentPage = page;
      this.cdr.detectChanges();
    }
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
    this.cdr.detectChanges();
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
