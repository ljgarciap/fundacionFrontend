import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compras-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './compras-detalle.html',
  styleUrl: './compras-detalle.css'
})
export class ComprasDetalle implements OnInit {
  user: any = null;
  idpedidos: number | null = null;
  pedido: any = null;
  items: any[] = [];
  loading = false;

  // Catalog products for search
  products: any[] = [];
  filteredProducts: any[] = [];
  searchProductQuery = '';
  showProductDropdown = false;

  // Add Item form state
  addingItem = {
    idproductos: '',
    cantidad: 1,
    valor: 0
  };

  // Payment/Finalize state
  showPaymentModal = false;
  paymentChannel = 'colombia'; // 'colombia' (Bancolombia), 'colpatria', 'efectivo' (Efectivo Robert)
  paymentDate = '';

  constructor(
    private api: Api,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.idpedidos = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPedidoDetails();
    this.loadProductsCatalog();
  }

  loadPedidoDetails() {
    if (!this.idpedidos) return;
    this.loading = true;
    this.api.get(`pedidos/${this.idpedidos}`).subscribe({
      next: (res: any) => {
        this.pedido = res;
        this.items = res.items || [];
        this.paymentDate = res.fecha;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadProductsCatalog() {
    this.api.get('tienda/inventario').subscribe({
      next: (res: any[]) => {
        this.products = res;
      }
    });
  }

  // --- Autocomplete Lógica ---
  onProductSearchChange() {
    const q = this.searchProductQuery.trim().toLowerCase();
    if (!q) {
      this.filteredProducts = [];
      this.showProductDropdown = false;
      return;
    }

    this.filteredProducts = this.products.filter(p => 
      p.detalle.toLowerCase().includes(q) || 
      (p.plu && p.plu.toLowerCase().includes(q))
    ).slice(0, 10); // cap at 10 results

    this.showProductDropdown = this.filteredProducts.length > 0;
  }

  selectProduct(prod: any) {
    this.addingItem.idproductos = prod.idproductos;
    this.addingItem.valor = prod.valorcompra || 0;
    this.searchProductQuery = prod.detalle;
    this.showProductDropdown = false;
  }

  // --- Add Item ---
  addItem() {
    if (!this.idpedidos || !this.addingItem.idproductos || this.addingItem.cantidad < 1) return;

    this.api.post(`pedidos/${this.idpedidos}/items`, this.addingItem).subscribe({
      next: () => {
        // Reset adding form
        this.addingItem = {
          idproductos: '',
          cantidad: 1,
          valor: 0
        };
        this.searchProductQuery = '';
        this.loadPedidoDetails();
      }
    });
  }

  // --- Remove Item ---
  removeItem(itemId: number) {
    if (!this.idpedidos) return;

    this.api.delete(`pedidos/${this.idpedidos}/items/${itemId}`).subscribe({
      next: () => this.loadPedidoDetails()
    });
  }

  // --- Payment / Finalize ---
  openPaymentModal() {
    this.showPaymentModal = true;
  }

  confirmPayment() {
    if (!this.idpedidos) return;

    this.api.post(`pedidos/${this.idpedidos}/finalizar`, {
      channel: this.paymentChannel,
      fecha: this.paymentDate
    }).subscribe({
      next: () => {
        this.showPaymentModal = false;
        this.router.navigate(['/compras']);
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
