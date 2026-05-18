import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css'
})
export class Tienda implements OnInit {
  user: any = null;
  products: any[] = [];
  residents: any[] = [];
  cart: any[] = [];
  selectedResident: any = null;
  loading = true;
  activeTab = 'pos'; // 'pos' or 'inventory'

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadInventory();
    this.loadResidents();
  }

  loadInventory() {
    this.api.get('tienda/inventario').subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      }
    });
  }

  loadResidents() {
    this.api.get('tienda/residentes').subscribe({
      next: (data) => this.residents = data
    });
  }

  addToCart(product: any) {
    if (product.stock <= 0) return;
    
    const existing = this.cart.find(item => item.idproductos === product.idproductos);
    if (existing) {
      if (existing.cantidad < product.stock) {
        existing.cantidad++;
      }
    } else {
      this.cart.push({
        idproductos: product.idproductos,
        detalle: product.detalle,
        cantidad: 1,
        precio: product.valorventa
      });
    }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  get totalCart() {
    return this.cart.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  }

  submitSale() {
    if (!this.selectedResident || this.cart.length === 0) return;

    if (this.totalCart > this.selectedResident.tienda_balance) {
      if (!confirm('El saldo del residente es insuficiente. ¿Desea continuar de todos modos?')) {
        return;
      }
    }

    const body = {
      idresidentes: this.selectedResident.idresidentes,
      items: this.cart
    };

    this.api.post('tienda/venta', body).subscribe({
      next: () => {
        alert('Venta realizada con éxito');
        this.cart = [];
        this.selectedResident = null;
        this.loadInventory();
        this.loadResidents();
      },
      error: (err) => alert('Error: ' + err.error?.message)
    });
  }

  printProductBarcodes() {
    window.open(`${this.api.getBaseUrl()}/formatos/barcodes/productos?token=${this.auth.getToken()}`, '_blank');
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
