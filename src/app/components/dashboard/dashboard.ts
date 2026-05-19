import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Ingreso } from '../ingreso/ingreso';
import { Pagos } from '../pagos/pagos';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, Ingreso, Pagos],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  residents: any[] = [];
  user: any = null;
  loading = true;
  filterStatus = 'A'; // Activos by default
  selectedResidentIds = new Set<number>();

  // Inline dynamic subviews
  currentSubview: 'LIST' | 'INGRESO' | 'PAGOS' | 'SISTEMA' = 'LIST';
  selectedPensionResidentId: number | null = null;

  // System Diagnostics and Notifications Dashboard
  systemStatus: any = null;
  systemNotifications: any[] = [];
  fixingSystem = false;
  loadingSystem = false;

  // Reactive Table Properties
  searchText = '';
  sortKey = 'nombresr';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;
  
  showStatusModal = false;
  showDetailModal = false;
  selectedRes: any = null;
  selectedResForDetail: any = null;
  statusData = {
    estado: '',
    motivo: '',
    fecha: new Date().toISOString().split('T')[0],
    valor_pension: 0,
    dia_cobro: 1
  };
  stats: any = {
    active_residents: 0,
    monthly_income: 0,
    monthly_sales: 0,
    pending_appointments: 0
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('[Dashboard] ngOnInit initialized');
    console.log('[Dashboard] isLoggedIn:', this.auth.isLoggedIn());
    try {
      this.user = this.auth.getUser();
      console.log('[Dashboard] User data:', this.user);
    } catch (e) {
      console.error('[Dashboard] Error reading user data:', e);
    }

    if (!this.auth.isLoggedIn()) {
      console.warn('[Dashboard] Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('[Dashboard] Invoking loadResidents and loadStats');
    this.loadResidents();
    this.loadStats();
    this.loadSystemNotifications();

    // Check if subview is passed in query parameters for direct navigation
    try {
      const urlTree = this.router.parseUrl(this.router.url);
      if (urlTree.queryParams && urlTree.queryParams['subview'] === 'SISTEMA') {
        this.setSubview('SISTEMA');
      }
    } catch (e) {
      console.error('[Dashboard] Error parsing subview query param:', e);
    }
  }

  loadStats() {
    console.log('[Dashboard] loadStats() called');
    this.api.get('reportes/dashboard').subscribe({
      next: (data) => {
        console.log('[Dashboard] loadStats success:', data);
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] loadStats error:', err);
        this.cdr.detectChanges();
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadResidents() {
    console.log('[Dashboard] loadResidents() called, filterStatus:', this.filterStatus);
    this.selectedResidentIds.clear();
    this.loading = true;
    this.api.get(`residentes?estado=${this.filterStatus}&with_relations=true`).subscribe({
      next: (data) => {
        console.log('[Dashboard] loadResidents success, count:', data?.length);
        this.residents = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] loadResidents error:', err);
        this.loading = false;
        this.cdr.detectChanges();
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  activeEditTab = 'residente';
  showEditModal = false;
  editData: any = {};

  openEditModal(res: any) {
    this.editData = {
      idresidentes: res.idresidentes,
      resident_data: {
        nombresr: res.nombresr || '',
        apellidosr: res.apellidosr || '',
        documentor: res.documentor || '',
        expedicionr: res.expedicionr || '',
        tipodocumento: (res.tipodocumento || 'C.C').trim().replace(/\.$/, ''),
        eps: res.eps || '',
        tipo_sanguineo: res.tipo_sanguineo || '',
        direccionf: res.direccionf || '',
        ciudad: res.ciudad || '',
        fechanacimiento: res.fechanacimiento || '',
        telefono: res.telefono || '',
        celular: res.celular || '',
        estudios: res.estudios || 'Ninguno',
        profesion: res.profesion || '',
        email: res.email || '',
        estadocivil: res.estadocivil || 'Soltero',
        conyuge: res.conyuge || '',
        padre: res.padre || '',
        madre: res.madre || ''
      },
      medical_data: {
        medicamentos: res.historial_medico?.medicamentos || '',
        alergias: res.historial_medico?.alergias || '',
        enfermedades: res.historial_medico?.enfermedades || '',
        fechaexamen: res.historial_medico?.fechaexamen || '',
        estadosalud: res.historial_medico?.estadosalud || 'Excelente',
        vacunas: res.historial_medico?.vacunas || 'Si',
        diagnosis: res.historial_medico?.diagnosis || '',
        hospitalizado: res.historial_medico?.hospitalizado || 'No',
        descripcion: res.historial_medico?.descripcion || ''
      },
      guardian_data: {
        nombres: res.acudientes?.[0]?.nombres || '',
        apellidos: res.acudientes?.[0]?.apellidos || '',
        documento: res.acudientes?.[0]?.documento || '',
        telefono: res.acudientes?.[0]?.telefono || '',
        email: res.acudientes?.[0]?.email || '',
        expedicion: res.acudientes?.[0]?.expedicion || '',
        autorizacion: res.acudientes?.[0]?.autorizacion || 'SI',
        parentesco: res.acudientes?.[0]?.pivot?.parentesco || 'Acudiente'
      },
      history_data: {
        fechaingreso: res.historial?.fechaingreso || '',
        motivoi: res.historial?.motivoi || '',
        tiempoadiccion: res.historial?.tiempoadiccion || 0,
        medidatiempo: res.historial?.medidatiempo || 'Años',
        drogasusadas: res.historial?.drogasusadas || '',
        problemas: res.historial?.problemas || 'No',
        carcel: res.historial?.carcel || 'No',
        fundaciones: res.historial?.fundaciones || '',
        motivos: res.historial?.motivos || '',
        referido: res.historial?.referido || ''
      },
      financial_data: {
        pension: res.cobrospension?.valorcobro || 0,
        uniforme: res.uniforme?.valorcobro || 0
      }
    };
    this.activeEditTab = 'residente';
    this.showEditModal = true;
    this.showDetailModal = false;
    this.cdr.detectChanges();
  }

  saveEdit() {
    this.loading = true;
    this.api.put(`residentes/${this.editData.idresidentes}`, this.editData).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showEditModal = false;
        
        Swal.fire({
          title: '¡Actualizado!',
          text: 'El residente y su formulario han sido actualizados correctamente.',
          icon: 'success',
          confirmButtonColor: 'var(--primary)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            htmlContainer: 'swal-premium-text'
          }
        });

        this.loadResidents();
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error saving resident edit:', err);
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron guardar los cambios: ' + (err.error?.message || 'Error desconocido'),
          icon: 'error',
          confirmButtonColor: 'var(--primary)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            htmlContainer: 'swal-premium-text'
          }
        });

        this.cdr.detectChanges();
      }
    });
  }

  openDetailModal(res: any) {
    this.selectedResForDetail = res;
    this.showDetailModal = true;
  }

  openStatusModal(res: any) {
    this.selectedRes = res;
    this.statusData = {
      estado: res.estado === 'I' ? 'A' : 'I',
      motivo: '',
      fecha: new Date().toISOString().split('T')[0],
      valor_pension: res.cobrospension?.valorcobro || 0,
      dia_cobro: res.cobrospension?.diacobro || 1
    };
    this.showStatusModal = true;
  }

  saveStatus() {
    const isActivating = this.statusData.estado === 'A' || this.statusData.estado === 'E';
    const actionText = isActivating ? 'reactivar' : 'inactivar';
    const confirmButtonText = isActivating ? 'Sí, reactivar' : 'Sí, inactivar';
    
    Swal.fire({
      title: '¿Confirmar cambio de estado?',
      text: `¿Está seguro de que desea ${actionText} a ${this.selectedRes.nombresr} ${this.selectedRes.apellidosr}?`,
      icon: isActivating ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isActivating ? 'var(--primary)' : '#d33',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        htmlContainer: 'swal-premium-text'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.patch(`residentes/${this.selectedRes.idresidentes}/status`, this.statusData).subscribe({
          next: () => {
            this.showStatusModal = false;
            
            Swal.fire({
              title: isActivating ? '¡Reactivado!' : '¡Inactivado!',
              text: `El residente ha sido ${isActivating ? 'reactivado' : 'inactivado'} con éxito.`,
              icon: 'success',
              confirmButtonColor: 'var(--primary)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title',
                htmlContainer: 'swal-premium-text'
              }
            });

            this.loadResidents();
            this.loadStats();
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo cambiar el estado: ' + (err.error?.message || 'Error desconocido'),
              icon: 'error',
              confirmButtonColor: 'var(--primary)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title',
                htmlContainer: 'swal-premium-text'
              }
            });
          }
        });
      }
    });
  }

  printForm(res: any) {
    window.open(`${this.api.getBaseUrl()}/formatos/ingreso/${res.idresidentes}?token=${this.auth.getToken()}`, '_blank');
  }

  printCarnet(res: any) {
    window.open(`${this.api.getBaseUrl()}/formatos/carnet/${res.idresidentes}?token=${this.auth.getToken()}`, '_blank');
  }

  toggleSelect(res: any) {
    if (this.selectedResidentIds.has(res.idresidentes)) {
      this.selectedResidentIds.delete(res.idresidentes);
    } else {
      this.selectedResidentIds.add(res.idresidentes);
    }
    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    const paginated = this.getPaginatedResidents();
    if (paginated.length === 0) return false;
    return paginated.every(r => this.selectedResidentIds.has(r.idresidentes));
  }

  toggleSelectAll() {
    const paginated = this.getPaginatedResidents();
    if (this.isAllSelected()) {
      paginated.forEach(r => this.selectedResidentIds.delete(r.idresidentes));
    } else {
      paginated.forEach(r => this.selectedResidentIds.add(r.idresidentes));
    }
    this.cdr.detectChanges();
  }

  isSelected(res: any): boolean {
    return this.selectedResidentIds.has(res.idresidentes);
  }

  printSelectedCarnets() {
    if (this.selectedResidentIds.size === 0) {
      Swal.fire({
        title: 'Atención',
        text: 'Debe seleccionar al menos un residente para imprimir sus carnets.',
        icon: 'warning',
        confirmButtonColor: 'var(--primary)',
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title',
          htmlContainer: 'swal-premium-text'
        }
      });
      return;
    }
    const ids = Array.from(this.selectedResidentIds).join(',');
    window.open(`${this.api.getBaseUrl()}/formatos/carnet/multiple?ids=${ids}&token=${this.auth.getToken()}`, '_blank');
  }

  printResidentsReport() {
    window.open(`${this.api.getBaseUrl()}/formatos/residentes/reporte?estado=${this.filterStatus}&token=${this.auth.getToken()}`, '_blank');
  }

  printResidentBarcodes() {
    this.printResidentsReport();
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

  getFilteredResidents() {
    if (!this.residents) return [];
    
    // Filter
    let result = this.residents.filter(r => {
      const fullname = `${r.nombresr || ''} ${r.apellidosr || ''}`.toLowerCase();
      const doc = (r.documentor || '').toLowerCase();
      const search = this.searchText.toLowerCase();
      return fullname.includes(search) || doc.includes(search);
    });

    // Sort
    result.sort((a, b) => {
      let valA: any = a[this.sortKey];
      let valB: any = b[this.sortKey];

      if (this.sortKey === 'nombresr') {
        valA = `${a.nombresr || ''} ${a.apellidosr || ''}`.toLowerCase();
        valB = `${b.nombresr || ''} ${b.apellidosr || ''}`.toLowerCase();
      } else {
        valA = valA !== null && valA !== undefined ? String(valA).toLowerCase() : '';
        valB = valB !== null && valB !== undefined ? String(valB).toLowerCase() : '';
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  getPaginatedResidents() {
    const filtered = this.getFilteredResidents();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  changeSort(key: string) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  totalPages() {
    const count = this.getFilteredResidents().length;
    return Math.ceil(count / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  openIngresoInline() {
    this.currentSubview = 'INGRESO';
    this.cdr.detectChanges();
  }

  openPagosInline(residentId: number) {
    this.selectedPensionResidentId = residentId;
    this.currentSubview = 'PAGOS';
    this.cdr.detectChanges();
  }

  closeInlineViews() {
    this.currentSubview = 'LIST';
    this.selectedPensionResidentId = null;
    this.loadResidents(); // Reload list to capture new residents or changes
    this.cdr.detectChanges();
  }

  setSubview(view: 'LIST' | 'INGRESO' | 'PAGOS' | 'SISTEMA') {
    this.currentSubview = view;
    if (view === 'SISTEMA') {
      this.loadSystemStatus();
      this.loadSystemNotifications();
    }
    this.cdr.detectChanges();
  }

  loadSystemStatus() {
    this.loadingSystem = true;
    this.api.get('system/status').subscribe({
      next: (data) => {
        this.systemStatus = data;
        this.loadingSystem = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] loadSystemStatus error:', err);
        this.loadingSystem = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSystemNotifications() {
    this.api.get('system/notifications').subscribe({
      next: (data: any) => {
        this.systemNotifications = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] loadSystemNotifications error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  autoFixSystem() {
    Swal.fire({
      title: '¿Confirmar Auto-corrección?',
      text: 'El sistema asociará un acudiente genérico y creará registros históricos por defecto para los residentes que tengan datos incompletos. Esto dejará alertas en el módulo de notificaciones.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Auto-reparar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        htmlContainer: 'swal-premium-text'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.fixingSystem = true;
        this.cdr.detectChanges();
        this.api.post('system/autofix', {}).subscribe({
          next: (res: any) => {
            this.fixingSystem = false;
            Swal.fire({
              title: 'Reparación Completada',
              html: `Se repararon: <br><b>${res.fixed_acudiente_count}</b> acudientes faltantes.<br><b>${res.fixed_historial_count}</b> historiales faltantes.`,
              icon: 'success',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title',
                htmlContainer: 'swal-premium-text'
              }
            });
            this.loadSystemStatus();
            this.loadSystemNotifications();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.fixingSystem = false;
            console.error('[Dashboard] autoFixSystem error:', err);
            Swal.fire({
              title: 'Error de Reparación',
              text: 'Ocurrió un error al procesar la auto-corrección.',
              icon: 'error',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title',
                htmlContainer: 'swal-premium-text'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  dismissNotification(id: number) {
    this.api.post(`system/notifications/${id}/dismiss`, {}).subscribe({
      next: () => {
        this.loadSystemNotifications();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] dismissNotification error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  dismissAllNotifications() {
    Swal.fire({
      title: '¿Descartar todas las alertas?',
      text: 'Esto marcará todas las anotaciones y notificaciones de corrección como entendidas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, descartar todas',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.post('system/notifications/dismiss-all', {}).subscribe({
          next: () => {
            this.loadSystemNotifications();
            this.cdr.detectChanges();
            Swal.fire('Descartadas', 'Todas las notificaciones han sido descartadas.', 'success');
          },
          error: (err) => {
            console.error('[Dashboard] dismissAllNotifications error:', err);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
