import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './compras.html',
  styleUrl: './compras.css'
})
export class Compras implements OnInit {
  user: any = null;
  activeTab: 'pedidos' | 'proveedores' = 'pedidos';

  // Pedidos (Facturas de Compra) state
  loadingPedidos = false;
  pedidos: any[] = [];
  searchQuery = '';
  startDate = '';
  endDate = '';
  selectedProveedorFilter: string = '';
  page = 1;
  lastPage = 1;
  total = 0;

  // Proveedores state
  loadingProveedores = false;
  proveedores: any[] = [];

  // Modal Proveedores
  showProveedorModal = false;
  isEditingProveedor = false;
  editingProveedorId: number | null = null;
  proveedorForm = {
    nombre: '',
    estado: 1
  };

  // Modal Nuevo Pedido
  showPedidoModal = false;
  pedidoForm = {
    fecha: new Date().toISOString().split('T')[0],
    documento: '',
    idproveedores: '',
    valor: 0,
    observaciones: ''
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadPedidos();
    this.loadProveedores();
  }

  setTab(tab: 'pedidos' | 'proveedores') {
    this.activeTab = tab;
  }

  loadPedidos() {
    this.loadingPedidos = true;
    let url = `pedidos?page=${this.page}`;
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }
    if (this.startDate) {
      url += `&start_date=${this.startDate}`;
    }
    if (this.endDate) {
      url += `&end_date=${this.endDate}`;
    }
    if (this.selectedProveedorFilter) {
      url += `&idproveedores=${this.selectedProveedorFilter}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        this.pedidos = res.data;
        this.total = res.total;
        this.lastPage = res.last_page;
        this.loadingPedidos = false;
      },
      error: () => this.loadingPedidos = false
    });
  }

  loadProveedores() {
    this.loadingProveedores = true;
    this.api.get('proveedores').subscribe({
      next: (res: any) => {
        this.proveedores = res;
        this.loadingProveedores = false;
      },
      error: () => this.loadingProveedores = false
    });
  }

  // Pagination helpers
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadPedidos();
    }
  }

  nextPage() {
    if (this.page < this.lastPage) {
      this.page++;
      this.loadPedidos();
    }
  }

  applyFilters() {
    this.page = 1;
    this.loadPedidos();
  }

  clearFilters() {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.selectedProveedorFilter = '';
    this.page = 1;
    this.loadPedidos();
  }

  // --- CRUD Proveedores ---
  openAddProveedor() {
    this.isEditingProveedor = false;
    this.editingProveedorId = null;
    this.proveedorForm = { nombre: '', estado: 1 };
    this.showProveedorModal = true;
  }

  openEditProveedor(prov: any) {
    this.isEditingProveedor = true;
    this.editingProveedorId = prov.idproveedores;
    this.proveedorForm = {
      nombre: prov.nombre,
      estado: prov.estado
    };
    this.showProveedorModal = true;
  }

  saveProveedor() {
    if (!this.proveedorForm.nombre.trim()) return;

    if (this.isEditingProveedor && this.editingProveedorId) {
      this.api.put(`proveedores/${this.editingProveedorId}`, this.proveedorForm).subscribe({
        next: () => {
          this.showProveedorModal = false;
          this.loadProveedores();
        }
      });
    } else {
      this.api.post('proveedores', { nombre: this.proveedorForm.nombre }).subscribe({
        next: () => {
          this.showProveedorModal = false;
          this.loadProveedores();
        }
      });
    }
  }

  toggleProveedorStatus(prov: any) {
    const newStatus = prov.estado === 1 ? 0 : 1;
    this.api.put(`proveedores/${prov.idproveedores}`, {
      nombre: prov.nombre,
      estado: newStatus
    }).subscribe({
      next: () => this.loadProveedores()
    });
  }

  // --- Pedido Lifecycle ---
  openAddPedido() {
    this.pedidoForm = {
      fecha: new Date().toISOString().split('T')[0],
      documento: '',
      idproveedores: '',
      valor: 0,
      observaciones: ''
    };
    this.showPedidoModal = true;
  }

  savePedido() {
    if (!this.pedidoForm.documento || !this.pedidoForm.idproveedores) return;

    this.api.post('pedidos', this.pedidoForm).subscribe({
      next: (res: any) => {
        this.showPedidoModal = false;
        this.router.navigate(['/compras', res.idpedidos]);
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
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
