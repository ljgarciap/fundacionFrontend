import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  limit = 10;

  // Modal / Transaction state
  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  formData = {
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    detalle: '',
    tipologia: '1', // 1 = Entrada (Debito), 2 = Salida (Credito)
    valor: 0,
    channel: 'colombia'
  };

  // Autocomplete state
  actores: any[] = [];
  filteredActores: any[] = [];
  showActorDropdown = false;

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadBalances();
    this.loadMovements();
    this.loadActores();
    this.loadConceptos();
  }

  loadBalances() {
    this.loadingBalances = true;
    this.cdr.detectChanges();
    this.api.get('contabilidad/balances').subscribe({
      next: (res: any) => {
        this.balances = res;
        this.loadingBalances = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingBalances = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMovements() {
    this.loadingMovements = true;
    this.cdr.detectChanges();
    let url = `contabilidad/movimientos?channel=${this.selectedChannel}&page=${this.page}&limit=${this.limit}`;
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMovements = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadActores() {
    this.api.get('actores').subscribe({
      next: (data: any) => {
        this.actores = data;
        this.cdr.detectChanges();
      }
    });
  }

  loadConceptos() {
    this.api.get('conceptos').subscribe({
      next: (data: any) => {
        this.conceptosComunes = data.map((c: any) => c.nombre);
        this.cdr.detectChanges();
      }
    });
  }

  selectChannel(channel: 'colombia' | 'colpatria' | 'efectivo' | 'externa') {
    this.selectedChannel = channel;
    this.page = 1;
    this.loadMovements();
    this.cdr.detectChanges();
  }

  onFilterChange() {
    this.page = 1;
    this.loadMovements();
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1;
    this.loadMovements();
    this.cdr.detectChanges();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadMovements();
      this.cdr.detectChanges();
    }
  }

  onDetalleInput() {
    const term = this.formData.detalle.toLowerCase();
    if (!term) {
      this.filteredActores = [];
      this.showActorDropdown = false;
      this.cdr.detectChanges();
      return;
    }

    this.filteredActores = this.actores.filter(a => 
      a.nombre.toLowerCase().includes(term)
    ).slice(0, 5);

    this.showActorDropdown = this.filteredActores.length > 0;
    this.cdr.detectChanges();
  }

  selectActor(a: any) {
    this.formData.detalle = a.nombre;
    this.showActorDropdown = false;
    this.cdr.detectChanges();
  }

  openNewModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      detalle: '',
      tipologia: '1',
      valor: 0,
      channel: this.selectedChannel
    };
    this.showActorDropdown = false;
    this.filteredActores = [];
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(m: any) {
    this.isEditing = true;
    this.editingId = m.id;
    this.formData = {
      fecha: m.fecha,
      concepto: m.concepto,
      detalle: m.detalle === 'N/A' ? '' : m.detalle,
      tipologia: m.entrada > 0 ? '1' : '2',
      valor: m.entrada > 0 ? m.entrada : m.salida,
      channel: this.selectedChannel
    };
    this.showActorDropdown = false;
    this.filteredActores = [];
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  submitForm() {
    const payload = {
      ...this.formData
    };

    if (this.isEditing && this.editingId !== null) {
      this.api.put(`contabilidad/movimientos/${this.editingId}`, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadBalances();
          this.loadMovements();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          alert('Error al actualizar transacción: ' + (err.error?.message || err.message));
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.post('contabilidad/movimientos', payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadBalances();
          this.loadMovements();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          alert('Error al registrar transacción: ' + (err.error?.message || err.message));
          this.cdr.detectChanges();
        }
      });
    }
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.page = 1;
    this.loadMovements();
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
