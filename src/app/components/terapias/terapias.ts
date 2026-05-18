import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-terapias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './terapias.html',
  styleUrl: './terapias.css'
})
export class Terapias implements OnInit {
  user: any = null;
  loading = false;
  saving = false;
  activeTab = 'cognitiva'; // 'cognitiva' or 'espiritual'

  residents: any[] = [];
  usersList: any[] = []; // Orientadores/Profesionales

  // List data
  sesionesCognitivas: any[] = [];
  sesionesEspirituales: any[] = [];

  // Filters
  filterResidente = '';
  filterDesde = '';
  filterHasta = '';
  searchQuery = '';

  // Modal control
  showCognitivaModal = false;
  showEspiritualModal = false;
  isEditing = false;
  selectedTerapiaId: number | null = null;

  // Forms
  cognitivaForm = {
    idresidentes: '',
    fecha: new Date().toISOString().split('T')[0],
    colider: '',
    fallas: '',
    observaciones: '',
    ayudas: ''
  };

  espiritualForm = {
    idresidentes: '',
    idusuarios: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    resumen: '',
    evaluacion: '',
    tecnicas: '',
    tarea: ''
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResidents();
    this.loadUsers();
    this.loadSessions();
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (res: any) => this.residents = res,
      error: () => {}
    });
  }

  loadUsers() {
    // Standard endpoint to get professionals or all administrative users
    this.api.get('users').subscribe({
      next: (res: any) => this.usersList = res,
      error: () => {
        // Fallback in case endpoint varies
        this.usersList = [
          { idusuarios: this.user?.idusuarios || 1, nombres: this.user?.nombres || 'Administrador', apellidos: this.user?.apellidos || '' }
        ];
      }
    });
  }

  loadSessions() {
    this.loading = true;
    const params: any = {};
    if (this.filterResidente) params['idresidentes'] = this.filterResidente;
    if (this.filterDesde)     params['desde'] = this.filterDesde;
    if (this.filterHasta)     params['hasta'] = this.filterHasta;

    const qs = new URLSearchParams(params).toString();
    const endpoint = this.activeTab === 'cognitiva' ? 'terapias/cognitiva' : 'terapias/espiritual';

    this.api.get(`${endpoint}${qs ? '?' + qs : ''}`).subscribe({
      next: (res: any) => {
        if (this.activeTab === 'cognitiva') {
          this.sesionesCognitivas = res;
        } else {
          this.sesionesEspirituales = res;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.clearFilters();
  }

  applyFilters() {
    this.loadSessions();
  }

  clearFilters() {
    this.filterResidente = '';
    this.filterDesde = '';
    this.filterHasta = '';
    this.searchQuery = '';
    this.loadSessions();
  }

  get filteredCognitivas() {
    if (!this.searchQuery) return this.sesionesCognitivas;
    const q = this.searchQuery.toLowerCase();
    return this.sesionesCognitivas.filter(s =>
      s.nombresr?.toLowerCase().includes(q) ||
      s.apellidosr?.toLowerCase().includes(q) ||
      s.colider?.toLowerCase().includes(q) ||
      s.fallas?.toLowerCase().includes(q) ||
      s.observaciones?.toLowerCase().includes(q)
    );
  }

  get filteredEspirituales() {
    if (!this.searchQuery) return this.sesionesEspirituales;
    const q = this.searchQuery.toLowerCase();
    return this.sesionesEspirituales.filter(s =>
      s.nombresr?.toLowerCase().includes(q) ||
      s.apellidosr?.toLowerCase().includes(q) ||
      s.orientador?.toLowerCase().includes(q) ||
      s.resumen?.toLowerCase().includes(q) ||
      s.evaluacion?.toLowerCase().includes(q)
    );
  }

  // ─── Modal Actions: Cognitiva ─────────────────────────────
  openNuevoCognitiva() {
    this.isEditing = false;
    this.selectedTerapiaId = null;
    this.cognitivaForm = {
      idresidentes: '',
      fecha: new Date().toISOString().split('T')[0],
      colider: '',
      fallas: '',
      observaciones: '',
      ayudas: ''
    };
    this.showCognitivaModal = true;
  }

  openEditCognitiva(s: any) {
    this.isEditing = true;
    this.selectedTerapiaId = s.idterapiac;
    this.cognitivaForm = {
      idresidentes: s.idresidentes.toString(),
      fecha: s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      colider: s.colider,
      fallas: s.fallas || '',
      observaciones: s.observaciones || '',
      ayudas: s.ayudas || ''
    };
    this.showCognitivaModal = true;
  }

  saveCognitiva() {
    if (!this.cognitivaForm.idresidentes || !this.cognitivaForm.fecha || !this.cognitivaForm.colider) return;
    this.saving = true;

    if (this.isEditing && this.selectedTerapiaId) {
      this.api.put(`terapias/cognitiva/${this.selectedTerapiaId}`, this.cognitivaForm).subscribe({
        next: () => {
          this.saving = false;
          this.showCognitivaModal = false;
          this.loadSessions();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.api.post('terapias/cognitiva', this.cognitivaForm).subscribe({
        next: () => {
          this.saving = false;
          this.showCognitivaModal = false;
          this.loadSessions();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // ─── Modal Actions: Espiritual ────────────────────────────
  openNuevoEspiritual() {
    this.isEditing = false;
    this.selectedTerapiaId = null;
    this.espiritualForm = {
      idresidentes: '',
      idusuarios: this.user?.idusuarios?.toString() || '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      resumen: '',
      evaluacion: '',
      tecnicas: '',
      tarea: ''
    };
    this.showEspiritualModal = true;
  }

  openEditEspiritual(s: any) {
    this.isEditing = true;
    this.selectedTerapiaId = s.idterapiae;
    this.espiritualForm = {
      idresidentes: s.idresidentes.toString(),
      idusuarios: s.idusuarios.toString(),
      fecha: s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      hora: s.hora ? s.hora.slice(0, 5) : new Date().toTimeString().slice(0, 5),
      resumen: s.resumen || '',
      evaluacion: s.evaluacion || '',
      tecnicas: s.tecnicas || '',
      tarea: s.tarea || ''
    };
    this.showEspiritualModal = true;
  }

  saveEspiritual() {
    if (!this.espiritualForm.idresidentes || !this.espiritualForm.idusuarios || !this.espiritualForm.fecha || !this.espiritualForm.hora) return;
    this.saving = true;

    if (this.isEditing && this.selectedTerapiaId) {
      this.api.put(`terapias/espiritual/${this.selectedTerapiaId}`, this.espiritualForm).subscribe({
        next: () => {
          this.saving = false;
          this.showEspiritualModal = false;
          this.loadSessions();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.api.post('terapias/espiritual', this.espiritualForm).subscribe({
        next: () => {
          this.saving = false;
          this.showEspiritualModal = false;
          this.loadSessions();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
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
