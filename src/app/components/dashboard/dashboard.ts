import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  residents: any[] = [];
  user: any = null;
  loading = true;
  filterStatus = 'A'; // Activos by default

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
    this.loading = true;
    this.api.get(`residentes?estado=${this.filterStatus}`).subscribe({
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

  printResidentBarcodes() {
    window.open(`${this.api.getBaseUrl()}/formatos/barcodes/residentes?token=${this.auth.getToken()}`, '_blank');
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

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
