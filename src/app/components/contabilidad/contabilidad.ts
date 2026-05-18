import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './contabilidad.html',
  styleUrl: './contabilidad.css'
})
export class Contabilidad implements OnInit {
  user: any = null;
  loadingBalances = true;
  loadingMovements = false;

  // Balances for the 4 card channels
  balances = {
    colombia: 0,
    colpatria: 0,
    efectivo: 0,
    externa: 0
  };

  // Movements state
  selectedChannel: 'colombia' | 'colpatria' | 'efectivo' | 'externa' = 'colombia';
  movements: any[] = [];
  searchQuery = '';
  startDate = '';
  endDate = '';
  page = 1;
  lastPage = 1;
  total = 0;

  // Modal / Transaction state
  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  formData = {
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    detalle: '',
    tipologia: '1', // 1 = Entrada (Debito), 2 = Salida (Credito)
    valor: 0
  };

  // Autocomplete state
  residents: any[] = [];
  filteredResidents: any[] = [];
  showResDropdown = false;

  conceptosComunes = [
    'ABONO PENSION',
    'APOYO FAMILIAR',
    'PAGO NOMINA',
    'COMPRA MERCADERIA',
    'DONACION',
    'DIEZMO',
    'RETIRO DE CAJA',
    'PAGO SERVICIOS PUBLICOS',
    'COMPRA ALIMENTOS',
    'AJUSTE DE CAJA',
    'PAGO HONORARIOS',
    'GASTOS DIVERSOS'
  ];

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadBalances();
    this.loadMovements();
    this.loadResidents();
  }

  loadBalances() {
    this.loadingBalances = true;
    this.api.get('contabilidad/balances').subscribe({
      next: (res: any) => {
        this.balances = res;
        this.loadingBalances = false;
      },
      error: () => this.loadingBalances = false
    });
  }

  loadMovements() {
    this.loadingMovements = true;
    let url = `contabilidad/movimientos?channel=${this.selectedChannel}&page=${this.page}`;
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }
    if (this.startDate) {
      url += `&start_date=${this.startDate}`;
    }
    if (this.endDate) {
      url += `&end_date=${this.endDate}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        this.movements = res.data;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.loadingMovements = false;
      },
      error: () => this.loadingMovements = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (data: any) => {
        this.residents = data;
      }
    });
  }

  selectChannel(channel: 'colombia' | 'colpatria' | 'efectivo' | 'externa') {
    this.selectedChannel = channel;
    this.page = 1;
    this.loadMovements();
  }

  onFilterChange() {
    this.page = 1;
    this.loadMovements();
  }

  clearFilters() {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1;
    this.loadMovements();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadMovements();
    }
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
    ).slice(0, 5);

    this.showResDropdown = this.filteredResidents.length > 0;
  }

  selectResident(r: any) {
    this.formData.detalle = `${r.nombresr} ${r.apellidosr}`;
    this.showResDropdown = false;
  }

  openNewModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      detalle: '',
      tipologia: '1',
      valor: 0
    };
    this.showResDropdown = false;
    this.showModal = true;
  }

  openEditModal(m: any) {
    this.isEditing = true;
    this.editingId = m.id;
    this.formData = {
      fecha: m.fecha,
      concepto: m.concepto,
      detalle: m.detalle === 'N/A' ? '' : m.detalle,
      tipologia: m.entrada > 0 ? '1' : '2',
      valor: m.entrada > 0 ? m.entrada : m.salida
    };
    this.showResDropdown = false;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitForm() {
    const payload = {
      ...this.formData,
      channel: this.selectedChannel
    };

    if (this.isEditing && this.editingId !== null) {
      this.api.put(`contabilidad/movimientos/${this.editingId}`, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadBalances();
          this.loadMovements();
        },
        error: (err: any) => alert('Error al actualizar transacción: ' + (err.error?.message || err.message))
      });
    } else {
      this.api.post('contabilidad/movimientos', payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadBalances();
          this.loadMovements();
        },
        error: (err: any) => alert('Error al registrar transacción: ' + (err.error?.message || err.message))
      });
    }
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
