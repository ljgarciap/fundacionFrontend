import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-almuerzos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './almuerzos.html',
  styleUrl: './almuerzos.css'
})
export class Almuerzos implements OnInit {
  user: any = null;
  loading = false;
  saving = false;

  almuerzos: any[] = [];
  residents: any[] = [];
  searchQuery = '';

  // Modal: Facturar nuevo almuerzo
  showNuevoModal = false;
  nuevoForm = {
    idresidentes: '',
    valorinicial: 0,
    fechaventa: new Date().toISOString().split('T')[0],
    observaciones: ''
  };

  // Modal: Registrar abono
  showAbonoModal = false;
  selectedCobro: any = null;
  abonoForm = {
    abono: 0,
    fechaabono: new Date().toISOString().split('T')[0],
    channel: 'none'
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadAlmuerzos();
    this.loadResidents();
  }

  loadAlmuerzos() {
    this.loading = true;
    this.api.get('almuerzos').subscribe({
      next: (res: any) => {
        this.almuerzos = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => this.residents = res,
      error: (err) => console.error('Error cargando residentes', err)
    });
  }

  get filteredAlmuerzos() {
    if (!this.searchQuery) return this.almuerzos;
    const q = this.searchQuery.toLowerCase();
    return this.almuerzos.filter(a =>
      a.nombresr?.toLowerCase().includes(q) ||
      a.apellidosr?.toLowerCase().includes(q) ||
      a.observaciones?.toLowerCase().includes(q)
    );
  }

  openNuevoModal() {
    this.nuevoForm = {
      idresidentes: '',
      valorinicial: 0,
      fechaventa: new Date().toISOString().split('T')[0],
      observaciones: ''
    };
    this.showNuevoModal = true;
  }

  saveNuevo() {
    if (!this.nuevoForm.idresidentes || this.nuevoForm.valorinicial <= 0) return;
    this.saving = true;
    this.api.post('almuerzos', this.nuevoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showNuevoModal = false;
        this.loadAlmuerzos();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  openAbonoModal(cobro: any) {
    this.selectedCobro = cobro;
    this.abonoForm = {
      abono: cobro.saldo,
      fechaabono: new Date().toISOString().split('T')[0],
      channel: 'none'
    };
    this.showAbonoModal = true;
  }

  saveAbono() {
    if (this.abonoForm.abono <= 0 || !this.selectedCobro) return;
    this.saving = true;
    this.api.post(`almuerzos/${this.selectedCobro.idcobroalmuerzos}/pagos`, this.abonoForm).subscribe({
      next: () => {
        this.saving = false;
        this.showAbonoModal = false;
        this.loadAlmuerzos();
      },
      error: (err) => {
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
