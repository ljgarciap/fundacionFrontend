import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ahorro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './ahorro.html',
  styleUrl: './ahorro.css'
})
export class Ahorro implements OnInit {
  user: any = null;
  transacciones: any[] = [];
  saldoActual = 0;
  residents: any[] = [];
  filteredResidents: any[] = [];
  loading = true;
  searchQuery = '';
  page = 1;
  lastPage = 1;
  showResDropdown = false;

  showModal = false;
  formData = {
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    detalle: '',
    idtipologia: '1', // 1 = Entrada, 2 = Salida
    valor: 0
  };

  conceptosComunes = [
    'PLATA QUE TENIA',
    'SALDO DE PENSION',
    'ABONO AHORRO DIARIO',
    'VENTA DE UNIFORMES',
    'RETIRO AHORRO PERSONAL',
    'AJUSTE DE CAJA',
    'PAGO VARIOS'
  ];

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadAhorros();
    this.loadResidents();
  }

  loadAhorros() {
    this.loading = true;
    const url = `ahorros?page=${this.page}&search=${encodeURIComponent(this.searchQuery)}`;
    this.api.get(url).subscribe({
      next: (res: any) => {
        this.transacciones = res.transacciones.data;
        this.lastPage = res.transacciones.last_page;
        this.saldoActual = res.saldo_actual;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (data: any) => {
        this.residents = data;
      }
    });
  }

  onSearchChange() {
    this.page = 1;
    this.loadAhorros();
  }

  onDetalleInput() {
    const term = this.formData.detalle.toLowerCase();
    if (!term) {
      this.filteredResidents = [];
      this.showResDropdown = false;
      return;
    }

    this.filteredResidents = this.residents.filter(r => 
      r.nombresr.toLowerCase().includes(term) || 
      r.apellidosr.toLowerCase().includes(term) ||
      r.documentor.includes(term)
    ).slice(0, 5); // Max 5 suggestions

    this.showResDropdown = this.filteredResidents.length > 0;
  }

  selectResident(r: any) {
    this.formData.detalle = `${r.nombresr} ${r.apellidosr}`;
    this.showResDropdown = false;
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadAhorros();
    }
  }

  openModal() {
    this.showModal = true;
    this.formData = {
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      detalle: '',
      idtipologia: '1',
      valor: 0
    };
    this.showResDropdown = false;
  }

  closeModal() {
    this.showModal = false;
  }

  submitAhorro() {
    this.api.post('ahorros', this.formData).subscribe({
      next: () => {
        this.closeModal();
        this.loadAhorros();
      },
      error: (err) => alert('Error al registrar transacción: ' + (err.error?.message || err.message))
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
