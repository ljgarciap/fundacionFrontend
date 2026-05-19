import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios implements OnInit {
  user: any = null;
  activeTab: 'uniformes' | 'lavadas' | 'almuerzos' = 'uniformes';
  saving = false;

  residents: any[] = [];

  // 👕 Uniforms state
  uniforms: any[] = [];
  searchUniformQuery = '';
  selectedUniform: any = null;
  showUniformAbonosModal = false;
  uniformAbonoForm = {
    abono: 0,
    fechaabono: new Date().toISOString().split('T')[0],
    channel: 'none'
  };
  uniformsLoading = false;
  uniformsLoaded = false;
  uniformsCurrentPage = 1;
  uniformsPageSize = 10;
  modalAbonosLoading = false;

  // 🧼 Laundry state
  lavadas: any[] = [];
  searchLaundryQuery = '';
  showAddLaundryModal = false;
  laundryForm = {
    idresidentes: '',
    valorinicial: 0,
    diacobro: new Date().toISOString().split('T')[0],
    nomfund: ''
  };
  showPayLaundryModal = false;
  selectedLaundry: any = null;
  laundryPayForm = {
    abono: 0,
    fechaabono: new Date().toISOString().split('T')[0],
    channel: 'none'
  };
  lavadasLoading = false;
  lavadasLoaded = false;
  laundryCurrentPage = 1;
  laundryPageSize = 10;

  // 🍽️ Lunch state
  almuerzos: any[] = [];
  searchLunchQuery = '';
  showLunchModal = false;
  lunchForm = {
    idresidentes: '',
    valorinicial: 0,
    fechaventa: new Date().toISOString().split('T')[0],
    observaciones: ''
  };
  showLunchAbonoModal = false;
  selectedLunch: any = null;
  lunchAbonoForm = {
    abono: 0,
    fechaabono: new Date().toISOString().split('T')[0],
    channel: 'none'
  };
  almuerzosLoading = false;
  almuerzosLoaded = false;
  lunchCurrentPage = 1;
  lunchPageSize = 10;

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResidents();
    this.loadTab(this.activeTab);
    this.cdr.detectChanges();
  }

  setTab(tab: 'uniformes' | 'lavadas' | 'almuerzos') {
    this.activeTab = tab;
    this.loadTab(tab);
    this.cdr.detectChanges();
  }

  loadTab(tab: 'uniformes' | 'lavadas' | 'almuerzos', force = false) {
    if (tab === 'uniformes') {
      if (!this.uniformsLoaded || force) {
        this.loadUniforms();
      }
    } else if (tab === 'lavadas') {
      if (!this.lavadasLoaded || force) {
        this.loadLavadas();
      }
    } else if (tab === 'almuerzos') {
      if (!this.almuerzosLoaded || force) {
        this.loadAlmuerzos();
      }
    }
    this.cdr.detectChanges();
  }

  loadResidents() {
    this.api.get('residentes?estado=A').subscribe({
      next: (res: any) => {
        this.residents = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading residents', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadUniforms() {
    this.uniformsLoading = true;
    this.cdr.detectChanges();
    this.api.get('uniformes').subscribe({
      next: (res: any) => {
        this.uniforms = res;
        this.uniformsLoading = false;
        this.uniformsLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.uniformsLoading = false;
        this.uniformsLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadLavadas() {
    this.lavadasLoading = true;
    this.cdr.detectChanges();
    this.api.get('lavadas').subscribe({
      next: (res: any) => {
        this.lavadas = res;
        this.lavadasLoading = false;
        this.lavadasLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.lavadasLoading = false;
        this.lavadasLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadAlmuerzos() {
    this.almuerzosLoading = true;
    this.cdr.detectChanges();
    this.api.get('almuerzos').subscribe({
      next: (res: any) => {
        this.almuerzos = res;
        this.almuerzosLoading = false;
        this.almuerzosLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.almuerzosLoading = false;
        this.almuerzosLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Uniforms actions ---
  updateUniformDelivery(unif: any, field: string, value: string) {
    const payload: any = {};
    payload[field] = value;
    this.api.put(`uniformes/${unif.iduniformes}`, payload).subscribe({
      next: () => { 
        unif[field] = value; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error actualizando estado: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  updateUniformComment(unif: any) {
    this.api.put(`uniformes/${unif.iduniformes}`, { comentario: unif.comentario }).subscribe({
      next: () => { this.cdr.detectChanges(); },
      error: (err) => {
        console.error('Error guardando comentario', err);
        this.cdr.detectChanges();
      }
    });
  }

  updateUniformPrice(unif: any) {
    const newValueStr = prompt('Ingrese el nuevo valor del cobro de uniformes:', unif.valorcobro);
    if (newValueStr === null) return;
    const newValue = parseInt(newValueStr);
    if (isNaN(newValue) || newValue < 0) {
      alert('Valor inválido');
      return;
    }
    this.api.put(`uniformes/${unif.iduniformes}`, { valorcobro: newValue }).subscribe({
      next: (res: any) => {
        unif.valorcobro = res.uniforme.valorcobro;
        unif.saldo = unif.valorcobro - unif.total_abonado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error guardando valor');
        this.cdr.detectChanges();
      }
    });
  }

  openUniformAbonos(unif: any) {
    this.selectedUniform = {
      ...unif,
      residente: unif.residente || { nombresr: unif.nombresr, apellidosr: unif.apellidosr }
    };
    this.uniformAbonoForm = {
      abono: 0,
      fechaabono: new Date().toISOString().split('T')[0],
      channel: 'none'
    };
    this.showUniformAbonosModal = true;
    this.modalAbonosLoading = true;
    this.cdr.detectChanges();

    this.api.get(`uniformes/${unif.iduniformes}`).subscribe({
      next: (res: any) => {
        this.selectedUniform = res;
        this.modalAbonosLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.modalAbonosLoading = false;
        alert('Error cargando abonos');
        this.cdr.detectChanges();
      }
    });
  }

  saveUniformAbono() {
    if (this.uniformAbonoForm.abono <= 0 || !this.selectedUniform) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.post(`uniformes/${this.selectedUniform.iduniformes}/abonos`, this.uniformAbonoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showUniformAbonosModal = false;
        this.loadUniforms();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  // --- Laundry actions ---
  openAddLaundry() {
    this.laundryForm = {
      idresidentes: '',
      valorinicial: 0,
      diacobro: new Date().toISOString().split('T')[0],
      nomfund: ''
    };
    this.showAddLaundryModal = true;
    this.cdr.detectChanges();
  }

  saveLaundry() {
    if (!this.laundryForm.idresidentes || this.laundryForm.valorinicial <= 0) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.post('lavadas', this.laundryForm).subscribe({
      next: () => {
        this.saving = false;
        this.showAddLaundryModal = false;
        this.loadLavadas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  openPayLaundry(lav: any) {
    this.selectedLaundry = lav;
    this.laundryPayForm = {
      abono: lav.nuevosaldo,
      fechaabono: new Date().toISOString().split('T')[0],
      channel: 'none'
    };
    this.showPayLaundryModal = true;
    this.cdr.detectChanges();
  }

  saveLaundryPayment() {
    if (this.laundryPayForm.abono <= 0 || !this.selectedLaundry) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.post(`lavadas/${this.selectedLaundry.idcobroslavada}/pagos`, this.laundryPayForm).subscribe({
      next: () => {
        this.saving = false;
        this.showPayLaundryModal = false;
        this.loadLavadas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  // --- Lunch actions ---
  openLunchModal() {
    this.lunchForm = {
      idresidentes: '',
      valorinicial: 0,
      fechaventa: new Date().toISOString().split('T')[0],
      observaciones: ''
    };
    this.showLunchModal = true;
    this.cdr.detectChanges();
  }

  saveLunch() {
    if (!this.lunchForm.idresidentes || this.lunchForm.valorinicial <= 0) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.post('almuerzos', this.lunchForm).subscribe({
      next: () => {
        this.saving = false;
        this.showLunchModal = false;
        this.loadAlmuerzos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  openLunchAbonoModal(lunch: any) {
    this.selectedLunch = lunch;
    this.lunchAbonoForm = {
      abono: lunch.saldo,
      fechaabono: new Date().toISOString().split('T')[0],
      channel: 'none'
    };
    this.showLunchAbonoModal = true;
    this.cdr.detectChanges();
  }

  saveLunchAbono() {
    if (this.lunchAbonoForm.abono <= 0 || !this.selectedLunch) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.post(`almuerzos/${this.selectedLunch.idcobroalmuerzos}/pagos`, this.lunchAbonoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showLunchAbonoModal = false;
        this.loadAlmuerzos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  // Filters helpers
  get filteredUniforms() {
    if (!this.uniforms) return [];
    if (!this.searchUniformQuery) return this.uniforms;
    const q = this.searchUniformQuery.toLowerCase();
    return this.uniforms.filter(u => 
      u.nombresr?.toLowerCase().includes(q) || 
      u.apellidosr?.toLowerCase().includes(q)
    );
  }

  get filteredLavadas() {
    if (!this.lavadas) return [];
    if (!this.searchLaundryQuery) return this.lavadas;
    const q = this.searchLaundryQuery.toLowerCase();
    return this.lavadas.filter(l => 
      l.nombresr?.toLowerCase().includes(q) || 
      l.apellidosr?.toLowerCase().includes(q) ||
      (l.nomfund && l.nomfund.toLowerCase().includes(q))
    );
  }

  get filteredAlmuerzos() {
    if (!this.almuerzos) return [];
    if (!this.searchLunchQuery) return this.almuerzos;
    const q = this.searchLunchQuery.toLowerCase();
    return this.almuerzos.filter(a =>
      a.nombresr?.toLowerCase().includes(q) ||
      a.apellidosr?.toLowerCase().includes(q) ||
      a.observaciones?.toLowerCase().includes(q)
    );
  }

  // --- Uniforms pagination helpers ---
  getPaginatedUniforms() {
    const filtered = this.filteredUniforms;
    const totalPages = Math.ceil(filtered.length / this.uniformsPageSize);
    if (this.uniformsCurrentPage > totalPages && totalPages > 0) {
      this.uniformsCurrentPage = totalPages;
    }
    const startIndex = (this.uniformsCurrentPage - 1) * this.uniformsPageSize;
    return filtered.slice(startIndex, startIndex + this.uniformsPageSize);
  }

  totalUniformsPages() {
    return Math.ceil(this.filteredUniforms.length / this.uniformsPageSize);
  }

  changeUniformsPage(page: number) {
    if (page >= 1 && page <= this.totalUniformsPages()) {
      this.uniformsCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  // --- Lavadas pagination helpers ---
  getPaginatedLavadas() {
    const filtered = this.filteredLavadas;
    const totalPages = Math.ceil(filtered.length / this.laundryPageSize);
    if (this.laundryCurrentPage > totalPages && totalPages > 0) {
      this.laundryCurrentPage = totalPages;
    }
    const startIndex = (this.laundryCurrentPage - 1) * this.laundryPageSize;
    return filtered.slice(startIndex, startIndex + this.laundryPageSize);
  }

  totalLavadasPages() {
    return Math.ceil(this.filteredLavadas.length / this.laundryPageSize);
  }

  changeLavadasPage(page: number) {
    if (page >= 1 && page <= this.totalLavadasPages()) {
      this.laundryCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  // --- Almuerzos pagination helpers ---
  getPaginatedAlmuerzos() {
    const filtered = this.filteredAlmuerzos;
    const totalPages = Math.ceil(filtered.length / this.lunchPageSize);
    if (this.lunchCurrentPage > totalPages && totalPages > 0) {
      this.lunchCurrentPage = totalPages;
    }
    const startIndex = (this.lunchCurrentPage - 1) * this.lunchPageSize;
    return filtered.slice(startIndex, startIndex + this.lunchPageSize);
  }

  totalAlmuerzosPages() {
    return Math.ceil(this.filteredAlmuerzos.length / this.lunchPageSize);
  }

  changeAlmuerzosPage(page: number) {
    if (page >= 1 && page <= this.totalAlmuerzosPages()) {
      this.lunchCurrentPage = page;
      this.cdr.detectChanges();
    }
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
