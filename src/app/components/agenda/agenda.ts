import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class Agenda implements OnInit {
  user: any = null;
  citas: any[] = [];
  loading = true;
  filterEstado = 'E'; // En espera by default
  residents: any[] = [];

  // Table sorting & pagination
  searchText = '';
  sortKey = 'fecha';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;
  
  showModal = false;
  formData = {
    fecha: new Date().toISOString().split('T')[0],
    hora: '08:00',
    idresidentes: '',
    encargado: 'PSICOLOGA'
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadAgenda();
    this.loadResidents();
  }

  loadAgenda() {
    this.loading = true;
    this.api.get(`agenda?estado=${this.filterEstado}`).subscribe({
      next: (data) => {
        this.citas = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (data) => this.residents = data
    });
  }

  updateStatus(cita: any, newStatus: string) {
    this.api.patch(`agenda/${cita.idagenda}/status`, { estado: newStatus }).subscribe({
      next: () => this.loadAgenda()
    });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitCita() {
    const body = {
      ...this.formData,
      idusuarios: this.user.idusuarios
    };

    this.api.post('agenda', body).subscribe({
      next: () => {
        this.closeModal();
        this.loadAgenda();
      },
      error: (err) => alert('Error: ' + err.error?.message)
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

  getFilteredCitas() {
    if (!this.citas) return [];
    
    // Filter by resident name / document
    return this.citas.filter(c => {
      const fullname = `${c.nombresr || ''} ${c.apellidosr || ''}`.toLowerCase();
      const doc = (c.documentor || '').toLowerCase();
      const search = this.searchText.toLowerCase();
      return fullname.includes(search) || doc.includes(search);
    });
  }

  getSortedAndPaginatedCitas() {
    let result = this.getFilteredCitas();

    // Sort
    result.sort((a, b) => {
      let valA: any = a[this.sortKey];
      let valB: any = b[this.sortKey];

      if (this.sortKey === 'residente') {
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

    // Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }

  changeSort(key: string) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  totalPages() {
    return Math.ceil(this.getFilteredCitas().length / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
