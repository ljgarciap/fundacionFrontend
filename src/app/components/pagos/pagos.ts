import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css'
})
export class Pagos implements OnInit {
  @Input() selectedResidentId: number | null = null;
  @Output() onBack = new EventEmitter<void>();

  user: any = null;
  pensiones: any[] = [];
  filteredPensiones: any[] = [];
  loading = true;
  filterState = 'ALL';
  
  showModal = false;
  modalType: 'ABONO' | 'CARGO' = 'ABONO';
  selectedPension: any = null;
  
  historyModal = false;
  selectedPensionForHistory: any = null;
  historyRecords: any[] = [];
  loadingHistory = false;
  
  historyCurrentPage = 1;
  historyPageSize = 10;
  
  formData = {
    valor: 0,
    comentario: '',
    fecha: new Date().toISOString().split('T')[0]
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
    this.cdr.detectChanges();
    this.api.get('pagos').subscribe({
      next: (data: any) => {
        this.pensiones = data;
        this.applyFilter();
        this.loading = false;
        
        // Auto-open history modal if selectedResidentId input is set or query param is present
        if (this.selectedResidentId) {
          const pension = this.pensiones.find(p => p.idresidentes == this.selectedResidentId);
          if (pension) {
            this.openHistory(pension);
          }
        } else {
          this.route.queryParams.subscribe(params => {
            if (params['id']) {
              const pension = this.pensiones.find(p => p.idresidentes == params['id']);
              if (pension) {
                this.openHistory(pension);
              }
            }
          });
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pagos', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    if (this.filterState === 'ALL') {
      this.filteredPensiones = this.pensiones;
    } else {
      this.filteredPensiones = this.pensiones.filter(p => p.estado === this.filterState);
    }
    this.cdr.detectChanges();
  }

  openModal(pension: any, type: 'ABONO' | 'CARGO') {
    this.selectedPension = pension;
    this.modalType = type;
    this.formData = {
      valor: pension.valorcobro, // Preload monthly fee for both cargo and abono!
      comentario: '',
      fecha: this.getLocalTodayDate()
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.selectedPension = null;
    this.cdr.detectChanges();
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
        // If we registered an abono/cargo and the history modal was open, refresh history too
        if (this.selectedPensionForHistory) {
          this.openHistory(this.selectedPensionForHistory);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al procesar: ' + (err.error?.message || 'Error desconocido'));
        this.cdr.detectChanges();
      }
    });
  }

  openHistory(pension: any) {
    this.selectedPensionForHistory = pension;
    this.loadingHistory = true;
    this.historyModal = true;
    this.historyCurrentPage = 1; // Reset pagination for history
    this.cdr.detectChanges();
    this.api.get(`pagos/${pension.idcobrospension}/abonos`).subscribe({
      next: (data: any[]) => {
        // Sort from oldest to newest to calculate progressive running balance correctly
        const sortedOldestFirst = [...data].sort((a, b) => {
          const dateDiff = new Date(a.fechaabono).getTime() - new Date(b.fechaabono).getTime();
          if (dateDiff !== 0) return dateDiff;
          return a.idabonopensiones - b.idabonopensiones;
        });

        let runningPension = 0;
        let runningAbono = 0;
        const processedRecords = sortedOldestFirst.map(record => {
          runningPension += Number(record.valorinicial || 0);
          runningAbono += Number(record.abono || 0);
          return {
            ...record,
            saldoAlDia: runningPension - runningAbono
          };
        });

        // Now reverse/sort newest first for display
        this.historyRecords = processedRecords.reverse();
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading history', err);
        this.loadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeHistory() {
    this.historyModal = false;
    this.selectedPensionForHistory = null;
    this.historyRecords = [];
    this.cdr.detectChanges();
  }

  openAbonoFromHistory() {
    if (this.selectedPensionForHistory) {
      const p = this.selectedPensionForHistory;
      this.openModal(p, 'ABONO');
    }
  }

  getPaginatedHistory(): any[] {
    const startIndex = (this.historyCurrentPage - 1) * this.historyPageSize;
    return this.historyRecords.slice(startIndex, startIndex + this.historyPageSize);
  }

  historyTotalPages(): number {
    return Math.ceil(this.historyRecords.length / this.historyPageSize);
  }

  changeHistoryPage(page: number) {
    if (page >= 1 && page <= this.historyTotalPages()) {
      this.historyCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  getLocalTodayDate(): string {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }
}
