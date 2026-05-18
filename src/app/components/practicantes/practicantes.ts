import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-practicantes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './practicantes.html',
  styleUrl: './practicantes.css'
})
export class Practicantes implements OnInit {
  user: any = null;
  loading = false;
  saving = false;

  practicantes: any[] = [];
  searchQuery = '';
  filterEstado = 'all';

  // Sort and Pagination
  sortKey = 'nombresp';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;

  showNuevoModal = false;
  form = {
    documentop: '',
    nombresp: '',
    apellidosp: '',
    telefono: '',
    email: '',
    eps: '',
    universidad: '',
    carrera: 'Psicología',
    semestre: '',
    fechanacimiento: ''
  };

  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.load();
  }

  load() {
    this.loading = true;
    this.api.get('practicantes').subscribe({
      next: (res: any) => { this.practicantes = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get filtered() {
    return this.practicantes.filter(p => {
      const matchSearch = !this.searchQuery ||
        `${p.nombresp} ${p.apellidosp} ${p.documentop}`.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchEstado = this.filterEstado === 'all' || p.estado === this.filterEstado;
      return matchSearch && matchEstado;
    });
  }

  getSortedAndPaginated() {
    let result = [...this.filtered];

    // Sort
    result.sort((a, b) => {
      let valA: any = a[this.sortKey];
      let valB: any = b[this.sortKey];

      if (this.sortKey === 'nombresp') {
        valA = `${a.nombresp || ''} ${a.apellidosp || ''}`.toLowerCase();
        valB = `${b.nombresp || ''} ${b.apellidosp || ''}`.toLowerCase();
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
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  get totalActivos() { return this.practicantes.filter(p => p.estado === 'A').length; }
  get totalInactivos() { return this.practicantes.filter(p => p.estado === 'I').length; }

  openNuevo() {
    this.form = { documentop:'', nombresp:'', apellidosp:'', telefono:'', email:'', eps:'', universidad:'', carrera:'Psicología', semestre:'', fechanacimiento:'' };
    this.showNuevoModal = true;
  }

  save() {
    if (!this.form.documentop || !this.form.nombresp || !this.form.apellidosp) return;
    this.saving = true;
    this.api.post('practicantes', this.form).subscribe({
      next: () => { this.saving = false; this.showNuevoModal = false; this.load(); },
      error: (err: any) => { this.saving = false; alert('Error: ' + (err.error?.message || err.message)); }
    });
  }

  toggleEstado(p: any) {
    const nuevoEstado = p.estado === 'A' ? 'I' : 'A';
    this.api.patch(`practicantes/${p.idpracticantes}/estado`, { estado: nuevoEstado }).subscribe({
      next: () => this.load(),
      error: (err: any) => alert('Error al cambiar estado: ' + err.error?.message)
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
