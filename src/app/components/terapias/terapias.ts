import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router, ActivatedRoute } from '@angular/router';
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
  viewState: 'list' | 'detail' = 'list';
  activeTab = 'psicologia'; // 'psicologia', 'cognitiva' or 'espiritual'

  residents: any[] = [];
  usersList: any[] = []; // Orientadores/Profesionales

  // List data
  sesionesCognitivas: any[] = [];
  sesionesEspirituales: any[] = [];
  seguimientos: any[] = []; // Clinical psychology follow-ups

  // Master Filters and Pagination (for active residents table)
  searchQuery = '';
  currentPage = 1;
  pageSize = 10;
  paginatedResidents: any[] = [];
  totalResidentsPages = 1;

  // Detail Filters and Pagination (for selected resident history)
  detailSearchQuery = '';
  detailCurrentPage = 1;
  detailPageSize = 5;
  paginatedDetailList: any[] = [];
  totalDetailPages = 1;

  // Selected state
  selectedResident: any = null;

  // Modal control
  showCognitivaModal = false;
  showEspiritualModal = false;
  showPsicoModal = false;
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

  psicoFormData = {
    resumen: '',
    evaluacion: '',
    tecnicas: '',
    tarea: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    this.loadResidents();
    this.loadUsers();
  }

  loadResidents() {
    this.loading = true;
    this.api.get('residentes?estado=A').subscribe({
      next: (res: any) => {
        try {
          this.residents = Array.isArray(res) ? res : [];
          this.currentPage = 1;
          this.updatePaginatedResidents();
        } catch (e) {
          console.error('Error processing residents:', e);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        try {
          this.residents = [];
          this.updatePaginatedResidents();
        } catch (e) {
          console.error('Error on residents fetch error:', e);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadUsers() {
    this.api.get('users').subscribe({
      next: (res: any) => {
        this.usersList = res;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersList = [
          { idusuarios: this.user?.idusuarios || 1, nombres: this.user?.nombres || 'Administrador', apellidos: this.user?.apellidos || '' }
        ];
        this.cdr.detectChanges();
      }
    });
  }

  selectResidentTherapy(resident: any, tab: 'psicologia' | 'cognitiva' | 'espiritual') {
    this.selectedResident = resident;
    this.activeTab = tab;
    this.viewState = 'detail';
    this.detailSearchQuery = '';
    this.detailCurrentPage = 1;
    this.loadTherapyData();
    this.cdr.detectChanges();
  }

  loadTherapyData() {
    if (!this.selectedResident) return;
    this.loading = true;
    const id = this.selectedResident.idresidentes;

    if (this.activeTab === 'psicologia') {
      this.api.get(`residentes/${id}/seguimientos`).subscribe({
        next: (data: any) => {
          try {
            this.seguimientos = Array.isArray(data) ? data : [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error processing psicologia data:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          try {
            this.seguimientos = [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error on psicologia request failure:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      });
    } else if (this.activeTab === 'cognitiva') {
      this.api.get(`terapias/cognitiva?idresidentes=${id}`).subscribe({
        next: (data: any) => {
          try {
            this.sesionesCognitivas = Array.isArray(data) ? data : [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error processing cognitiva data:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          try {
            this.sesionesCognitivas = [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error on cognitiva request failure:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      });
    } else if (this.activeTab === 'espiritual') {
      this.api.get(`terapias/espiritual?idresidentes=${id}`).subscribe({
        next: (data: any) => {
          try {
            this.sesionesEspirituales = Array.isArray(data) ? data : [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error processing espiritual data:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          try {
            this.sesionesEspirituales = [];
            this.detailCurrentPage = 1;
            this.updatePaginatedDetailList();
          } catch (e) {
            console.error('Error on espiritual request failure:', e);
          } finally {
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  goBack() {
    this.viewState = 'list';
    this.selectedResident = null;
    this.detailSearchQuery = '';
    this.detailCurrentPage = 1;
  }

  // ─── Pagination and Search Handlers ───────────────────────
  updatePaginatedResidents() {
    if (!this.residents) {
      this.paginatedResidents = [];
      this.totalResidentsPages = 1;
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    let filtered = this.residents;
    if (q) {
      filtered = this.residents.filter(r =>
        `${r.nombresr || ''} ${r.apellidosr || ''}`.toLowerCase().includes(q) ||
        (r.documentor || '').toLowerCase().includes(q)
      );
    }
    this.totalResidentsPages = Math.ceil(filtered.length / this.pageSize) || 1;
    if (this.currentPage > this.totalResidentsPages) {
      this.currentPage = this.totalResidentsPages;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedResidents = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  updatePaginatedDetailList() {
    let list: any[] = [];
    if (this.activeTab === 'psicologia') {
      list = this.seguimientos || [];
    } else if (this.activeTab === 'cognitiva') {
      list = this.sesionesCognitivas || [];
    } else if (this.activeTab === 'espiritual') {
      list = this.sesionesEspirituales || [];
    }

    const q = (this.detailSearchQuery || '').toLowerCase().trim();
    let filtered = list;
    if (q) {
      filtered = list.filter(item => {
        if (!item) return false;
        if (this.activeTab === 'psicologia') {
          return (item.resumen || '').toLowerCase().includes(q) ||
                 (item.evaluacion || '').toLowerCase().includes(q) ||
                 (item.tecnicas || '').toLowerCase().includes(q) ||
                 (item.tarea || '').toLowerCase().includes(q);
        } else if (this.activeTab === 'cognitiva') {
          return (item.colider || '').toLowerCase().includes(q) ||
                 (item.fallas || '').toLowerCase().includes(q) ||
                 (item.observaciones || '').toLowerCase().includes(q) ||
                 (item.ayudas || '').toLowerCase().includes(q);
        } else if (this.activeTab === 'espiritual') {
          const orientadorName = String(item.orientador || '');
          return orientadorName.toLowerCase().includes(q) ||
                 (item.resumen || '').toLowerCase().includes(q) ||
                 (item.evaluacion || '').toLowerCase().includes(q) ||
                 (item.tecnicas || '').toLowerCase().includes(q) ||
                 (item.tarea || '').toLowerCase().includes(q);
        }
        return false;
      });
    }

    this.totalDetailPages = Math.ceil(filtered.length / this.detailPageSize) || 1;
    if (this.detailCurrentPage > this.totalDetailPages) {
      this.detailCurrentPage = this.totalDetailPages;
    }
    const startIndex = (this.detailCurrentPage - 1) * this.detailPageSize;
    this.paginatedDetailList = filtered.slice(startIndex, startIndex + this.detailPageSize);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.updatePaginatedResidents();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalResidentsPages) {
      this.currentPage = page;
      this.updatePaginatedResidents();
    }
  }

  onDetailSearchChange() {
    this.detailCurrentPage = 1;
    this.updatePaginatedDetailList();
  }

  changeDetailPage(page: number) {
    if (page >= 1 && page <= this.totalDetailPages) {
      this.detailCurrentPage = page;
      this.updatePaginatedDetailList();
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.detailSearchQuery = '';
    this.detailCurrentPage = 1;
    this.loadTherapyData();
  }

  // ─── Modal Actions: Cognitiva ─────────────────────────────
  openNuevoCognitiva() {
    if (!this.selectedResident) return;
    this.isEditing = false;
    this.selectedTerapiaId = null;
    this.cognitivaForm = {
      idresidentes: this.selectedResident.idresidentes.toString(),
      fecha: new Date().toISOString().split('T')[0],
      colider: '',
      fallas: '',
      observaciones: '',
      ayudas: ''
    };
    this.showCognitivaModal = true;
  }

  openEditCognitiva(s: any) {
    if (!this.selectedResident) return;
    this.isEditing = true;
    this.selectedTerapiaId = s.idterapiac;
    this.cognitivaForm = {
      idresidentes: this.selectedResident.idresidentes.toString(),
      fecha: s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      colider: s.colider,
      fallas: s.fallas || '',
      observaciones: s.observaciones || '',
      ayudas: s.ayudas || ''
    };
    this.showCognitivaModal = true;
  }

  saveCognitiva() {
    if (!this.selectedResident || !this.cognitivaForm.fecha || !this.cognitivaForm.colider) return;
    this.saving = true;

    const body = {
      ...this.cognitivaForm,
      idresidentes: this.selectedResident.idresidentes
    };

    if (this.isEditing && this.selectedTerapiaId) {
      this.api.put(`terapias/cognitiva/${this.selectedTerapiaId}`, body).subscribe({
        next: () => {
          this.saving = false;
          this.showCognitivaModal = false;
          this.loadTherapyData();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.api.post('terapias/cognitiva', body).subscribe({
        next: () => {
          this.saving = false;
          this.showCognitivaModal = false;
          this.loadTherapyData();
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
    if (!this.selectedResident) return;
    this.isEditing = false;
    this.selectedTerapiaId = null;
    this.espiritualForm = {
      idresidentes: this.selectedResident.idresidentes.toString(),
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
    if (!this.selectedResident) return;
    this.isEditing = true;
    this.selectedTerapiaId = s.idterapiae;
    this.espiritualForm = {
      idresidentes: this.selectedResident.idresidentes.toString(),
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
    if (!this.selectedResident || !this.espiritualForm.idusuarios || !this.espiritualForm.fecha || !this.espiritualForm.hora) return;
    this.saving = true;

    const body = {
      ...this.espiritualForm,
      idresidentes: this.selectedResident.idresidentes
    };

    if (this.isEditing && this.selectedTerapiaId) {
      this.api.put(`terapias/espiritual/${this.selectedTerapiaId}`, body).subscribe({
        next: () => {
          this.saving = false;
          this.showEspiritualModal = false;
          this.loadTherapyData();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.api.post('terapias/espiritual', body).subscribe({
        next: () => {
          this.saving = false;
          this.showEspiritualModal = false;
          this.loadTherapyData();
        },
        error: (err: any) => {
          this.saving = false;
          alert('Error: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // ─── Psychology Tab Actions ──────────────────────────────


  openNuevoPsico() {
    if (!this.selectedResident) return;
    this.psicoFormData = {
      resumen: '',
      evaluacion: '',
      tecnicas: '',
      tarea: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
    this.showPsicoModal = true;
  }

  savePsico() {
    if (!this.selectedResident) return;
    this.saving = true;
    const body = {
      ...this.psicoFormData,
      idresidentes: this.selectedResident.idresidentes
    };

    this.api.post('seguimientos', body).subscribe({
      next: () => {
        this.saving = false;
        this.showPsicoModal = false;
        this.loadTherapyData();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  printSeguimiento(seg: any) {
    window.open(`${this.api.getBaseUrl()}/formatos/psicologia/${seg.idseguimientos}?token=${this.auth.getToken()}`, '_blank');
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
