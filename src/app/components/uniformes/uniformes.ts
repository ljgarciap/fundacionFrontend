import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-uniformes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './uniformes.html',
  styleUrl: './uniformes.css'
})
export class Uniformes implements OnInit {
  user: any = null;
  activeTab: 'uniformes' | 'lavadas' = 'uniformes';

  // General lists
  residents: any[] = [];
  loading = false;

  // Uniforms state
  uniforms: any[] = [];
  searchUniformQuery = '';
  selectedUniform: any = null;
  showUniformAbonosModal = false;
  uniformAbonoForm = {
    abono: 0,
    fechaabono: new Date().toISOString().split('T')[0],
    channel: 'none'
  };

  // Laundry state
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

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResidents();
    this.loadUniforms();
    this.loadLavadas();
  }

  setTab(tab: 'uniformes' | 'lavadas') {
    this.activeTab = tab;
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => this.residents = res,
      error: (err) => console.error('Error loading residents', err)
    });
  }

  loadUniforms() {
    this.loading = true;
    this.api.get('uniformes').subscribe({
      next: (res: any) => {
        this.uniforms = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadLavadas() {
    this.loading = true;
    this.api.get('lavadas').subscribe({
      next: (res: any) => {
        this.lavadas = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // --- Uniforms actions ---
  updateUniformDelivery(unif: any, field: string, value: string) {
    const payload: any = {};
    payload[field] = value;

    this.api.put(`uniformes/${unif.iduniformes}`, payload).subscribe({
      next: () => {
        unif[field] = value;
      },
      error: (err) => alert('Error actualizando estado: ' + (err.error?.message || err.message))
    });
  }

  updateUniformComment(unif: any) {
    this.api.put(`uniformes/${unif.iduniformes}`, {
      comentario: unif.comentario
    }).subscribe({
      next: () => alert('Comentario guardado con éxito'),
      error: (err) => alert('Error guardando comentario')
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

    this.api.put(`uniformes/${unif.iduniformes}`, {
      valorcobro: newValue
    }).subscribe({
      next: (res: any) => {
        unif.valorcobro = res.uniforme.valorcobro;
        unif.saldo = unif.valorcobro - unif.total_abonado;
      },
      error: (err) => alert('Error guardando valor')
    });
  }

  openUniformAbonos(unif: any) {
    this.api.get(`uniformes/${unif.iduniformes}`).subscribe({
      next: (res: any) => {
        this.selectedUniform = res;
        this.uniformAbonoForm = {
          abono: 0,
          fechaabono: new Date().toISOString().split('T')[0],
          channel: 'none'
        };
        this.showUniformAbonosModal = true;
      },
      error: () => alert('Error cargando abonos')
    });
  }

  saveUniformAbono() {
    if (this.uniformAbonoForm.abono <= 0 || !this.selectedUniform) return;

    this.api.post(`uniformes/${this.selectedUniform.iduniformes}/abonos`, this.uniformAbonoForm).subscribe({
      next: () => {
        this.showUniformAbonosModal = false;
        alert('Abono registrado con éxito');
        this.loadUniforms();
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
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
  }

  saveLaundry() {
    if (!this.laundryForm.idresidentes || this.laundryForm.valorinicial <= 0) return;

    this.api.post('lavadas', this.laundryForm).subscribe({
      next: () => {
        this.showAddLaundryModal = false;
        alert('Cargo de lavandería registrado con éxito');
        this.loadLavadas();
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
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
  }

  saveLaundryPayment() {
    if (this.laundryPayForm.abono <= 0 || !this.selectedLaundry) return;

    this.api.post(`lavadas/${this.selectedLaundry.idcobroslavada}/pagos`, this.laundryPayForm).subscribe({
      next: () => {
        this.showPayLaundryModal = false;
        alert('Abono a lavada registrado con éxito');
        this.loadLavadas();
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  // Filters helpers
  get filteredUniforms() {
    if (!this.searchUniformQuery) return this.uniforms;
    const q = this.searchUniformQuery.toLowerCase();
    return this.uniforms.filter(u => 
      u.nombresr.toLowerCase().includes(q) || 
      u.apellidosr.toLowerCase().includes(q)
    );
  }

  get filteredLavadas() {
    if (!this.searchLaundryQuery) return this.lavadas;
    const q = this.searchLaundryQuery.toLowerCase();
    return this.lavadas.filter(l => 
      l.nombresr.toLowerCase().includes(q) || 
      l.apellidosr.toLowerCase().includes(q) ||
      (l.nomfund && l.nomfund.toLowerCase().includes(q))
    );
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
