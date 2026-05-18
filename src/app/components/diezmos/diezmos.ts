import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-diezmos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './diezmos.html',
  styleUrl: './diezmos.css'
})
export class Diezmos implements OnInit {
  user: any = null;
  loading = false;
  saving = false;

  // Rango de fechas
  fechaini = '';
  fechafin = '';

  // Resultados del cálculo
  calcResult: any = {
    roca_ingresos: 0,
    jorec_ingresos: 0,
    total_ingresos: 0,
    diezmo_sugerido: 0,
    diezmo_pagado: 0,
    saldo_pendiente: 0
  };

  // Modal abonos
  showAbonoModal = false;
  abonoForm = {
    abono: 0,
    channel: 'roca',
    fecha: '',
    detalle: 'ABONO DIEZMO'
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.setPreset('current-month');
    this.calculateDiezmos();
  }

  // Atajos rápidos para fechas
  setPreset(preset: 'current-month' | 'last-month' | 'last-30' | 'current-year') {
    const today = new Date();
    let start: Date;
    let end: Date = new Date();

    if (preset === 'current-month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'last-month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (preset === 'last-30') {
      start = new Date();
      start.setDate(today.getDate() - 30);
    } else if (preset === 'current-year') {
      start = new Date(today.getFullYear(), 0, 1);
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    this.fechaini = this.formatDate(start);
    this.fechafin = this.formatDate(end);
    this.calculateDiezmos();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Llamada a la API para obtener el balance de diezmos
  calculateDiezmos() {
    if (!this.fechaini || !this.fechafin) return;
    this.loading = true;

    this.api.get(`diezmos/calculate?fechaini=${this.fechaini}&fechafin=${this.fechafin}`).subscribe({
      next: (res: any) => {
        this.calcResult = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        alert('Error al calcular diezmos: ' + (err.error?.message || err.message));
      }
    });
  }

  // Abrir modal de abonos
  openAbonoModal() {
    this.abonoForm = {
      abono: this.calcResult.saldo_pendiente,
      channel: 'roca',
      fecha: this.formatDate(new Date()),
      detalle: 'Abono diezmos ' + this.fechaini + ' al ' + this.fechafin
    };
    this.showAbonoModal = true;
  }

  // Guardar el abono en el backend
  saveAbono() {
    if (this.abonoForm.abono <= 0) {
      alert('El monto del abono debe ser mayor a 0');
      return;
    }

    this.saving = true;
    this.api.post('diezmos/abono', this.abonoForm).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showAbonoModal = false;
        alert('¡Abono al diezmo registrado con éxito!');
        this.calculateDiezmos();
      },
      error: (err) => {
        this.saving = false;
        alert('Error al registrar abono: ' + (err.error?.message || err.message));
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
