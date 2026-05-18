import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css'
})
export class Pagos implements OnInit {
  user: any = null;
  pensiones: any[] = [];
  filteredPensiones: any[] = [];
  loading = true;
  filterState = 'ALL';
  
  showModal = false;
  modalType: 'ABONO' | 'CARGO' = 'ABONO';
  selectedPension: any = null;
  
  formData = {
    valor: 0,
    comentario: '',
    fecha: new Date().toISOString().split('T')[0]
  };
  
  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadPagos();
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
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  loadPagos() {
    this.loading = true;
    this.api.get('pagos').subscribe({
      next: (data) => {
        this.pensiones = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pagos', err);
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (this.filterState === 'ALL') {
      this.filteredPensiones = this.pensiones;
    } else {
      this.filteredPensiones = this.pensiones.filter(p => p.estado === this.filterState);
    }
  }

  openModal(pension: any, type: 'ABONO' | 'CARGO') {
    this.selectedPension = pension;
    this.modalType = type;
    this.formData = {
      valor: type === 'CARGO' ? pension.valorcobro : 0,
      comentario: '',
      fecha: new Date().toISOString().split('T')[0]
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedPension = null;
  }

  submitAction() {
    const endpoint = this.modalType === 'ABONO' ? 'pagos/abono' : 'pagos/cargo';
    const body = {
      idcobrospension: this.selectedPension.idcobrospension,
      [this.modalType === 'ABONO' ? 'abono' : 'valorinicial']: this.formData.valor,
      comentario: this.formData.comentario,
      fechaabono: this.formData.fecha
    };

    this.api.post(endpoint, body).subscribe({
      next: () => {
        this.closeModal();
        this.loadPagos();
      },
      error: (err) => {
        alert('Error al procesar: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }
}
