import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './permisos.html',
  styleUrl: './permisos.css'
})
export class Permisos implements OnInit {
  user: any = null;
  loading = false;
  saving = false;

  permisos: any[] = [];
  residents: any[] = [];
  stats: any = { total: 0, fuera: 0, retorno: 0, residentes_fuera: [] };

  // Filters
  searchQuery = '';
  filterDesde = '';
  filterHasta = '';
  filterResidente = '';

  // Modal: Nueva Salida
  showNuevoModal = false;
  nuevoForm = {
    idresidentes: '',
    motivo: '',
    fechasalida: new Date().toISOString().split('T')[0],
    fechaingreso: '',
    observaciones: ''
  };

  // Modal: Registrar Retorno / Editar
  showRetornoModal = false;
  selectedPermiso: any = null;
  retornoForm = {
    fechaingreso: new Date().toISOString().split('T')[0],
    observaciones: ''
  };

  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.load();
    this.loadResidents();
    this.loadStats();
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterResidente) params['idresidentes'] = this.filterResidente;
    if (this.filterDesde)     params['desde'] = this.filterDesde;
    if (this.filterHasta)     params['hasta'] = this.filterHasta;

    const qs = new URLSearchParams(params).toString();
    this.api.get(`permisos${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => { this.permisos = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadStats() {
    this.api.get('permisos/stats').subscribe({
      next: (res: any) => this.stats = res,
      error: () => {}
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => this.residents = res,
      error: () => {}
    });
  }

  get filtered() {
    if (!this.searchQuery) return this.permisos;
    const q = this.searchQuery.toLowerCase();
    return this.permisos.filter(p =>
      p.nombresr?.toLowerCase().includes(q) ||
      p.apellidosr?.toLowerCase().includes(q) ||
      p.motivo?.toLowerCase().includes(q) ||
      p.observaciones?.toLowerCase().includes(q)
    );
  }

  applyFilters() {
    this.load();
  }

  clearFilters() {
    this.filterDesde = '';
    this.filterHasta = '';
    this.filterResidente = '';
    this.searchQuery = '';
    this.load();
  }

  estaFuera(p: any): boolean {
    return !p.fechaingreso || p.fechaingreso === '0000-00-00' || p.fechaingreso === '0000-00-00T00:00:00.000Z';
  }

  openNuevo() {
    this.nuevoForm = {
      idresidentes: '',
      motivo: '',
      fechasalida: new Date().toISOString().split('T')[0],
      fechaingreso: '',
      observaciones: ''
    };
    this.showNuevoModal = true;
  }

  saveNuevo() {
    if (!this.nuevoForm.idresidentes || !this.nuevoForm.motivo || !this.nuevoForm.fechasalida) return;
    this.saving = true;
    this.api.post('permisos', this.nuevoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showNuevoModal = false;
        this.load();
        this.loadStats();
      },
      error: (err: any) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  openRetorno(p: any) {
    this.selectedPermiso = p;
    this.retornoForm = {
      fechaingreso: new Date().toISOString().split('T')[0],
      observaciones: p.observaciones !== '.' ? p.observaciones : ''
    };
    this.showRetornoModal = true;
  }

  saveRetorno() {
    if (!this.selectedPermiso || !this.retornoForm.fechaingreso) return;
    this.saving = true;
    this.api.put(`permisos/${this.selectedPermiso.idpermisos}`, this.retornoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showRetornoModal = false;
        this.load();
        this.loadStats();
      },
      error: (err: any) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
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
