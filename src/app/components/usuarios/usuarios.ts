import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

interface User {
  idusuarios: number;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  idroles: number;
  role_name?: string;
  estado: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  usuarios: User[] = [];
  filteredUsuarios: User[] = [];
  searchQuery = '';
  loading = false;
  saving = false;
  error = '';
  success = '';

  // Sort and Pagination
  sortKey = 'nombres';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;

  // Roles available for administration
  availableRoles = [
    { id: 1, name: 'BDA (Base de Datos)' },
    { id: 2, name: 'Superadministrador' },
    { id: 3, name: 'Administrador' },
    { id: 4, name: 'Psicólogo' },
    { id: 6, name: 'Terapeuta General' },
    { id: 7, name: 'Practicante de Psicología' },
    { id: 8, name: 'Minutas / Minutero' },
    { id: 9, name: 'Cajero' }
  ];

  // Modals state
  showModal = false;
  isEditing = false;
  selectedUserId: number | null = null;

  // Form Fields
  form = {
    documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    idroles: 3, // Default to Admin
    password: '',
    
    // Academic fields if practicante
    eps: 'EPS Sanitas',
    universidad: '',
    carrera: 'Psicología',
    semestre: '',
    fechanacimiento: ''
  };

  constructor(public api: Api, public auth: Auth) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.error = '';
    
    this.api.get('usuarios').subscribe({
      next: (data: User[]) => {
        this.usuarios = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios de la base de datos';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    this.currentPage = 1;
    if (!this.searchQuery) {
      this.filteredUsuarios = [...this.usuarios];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredUsuarios = this.usuarios.filter(u => 
        u.nombres.toLowerCase().includes(q) || 
        u.apellidos.toLowerCase().includes(q) || 
        u.documento.includes(q) ||
        (u.role_name && u.role_name.toLowerCase().includes(q))
      );
    }
  }

  getSortedAndPaginatedUsers() {
    let result = [...this.filteredUsuarios];
    
    // Sort
    result.sort((a, b) => {
      let valA: any = a[this.sortKey as keyof User];
      let valB: any = b[this.sortKey as keyof User];

      if (this.sortKey === 'nombres') {
        valA = `${a.nombres || ''} ${a.apellidos || ''}`.toLowerCase();
        valB = `${b.nombres || ''} ${b.apellidos || ''}`.toLowerCase();
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
    return Math.ceil(this.filteredUsuarios.length / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.selectedUserId = null;
    this.error = '';
    this.success = '';
    this.form = {
      documento: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      idroles: 3,
      password: '',
      eps: 'EPS Sanitas',
      universidad: '',
      carrera: 'Psicología',
      semestre: '',
      fechanacimiento: ''
    };
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.isEditing = true;
    this.selectedUserId = user.idusuarios;
    this.error = '';
    this.success = '';
    
    this.form = {
      documento: user.documento,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email || '',
      telefono: user.telefono || '',
      idroles: user.idroles,
      password: '', // Kept empty for optional edit
      eps: 'EPS Sanitas',
      universidad: '',
      carrera: 'Psicología',
      semestre: '',
      fechanacimiento: ''
    };

    // If they are a practicante, load academic details from API or local if cached
    if (user.idroles === 7) {
      this.api.get('practicantes').subscribe({
        next: (practicantes: any[]) => {
          const p = practicantes.find(item => item.documentop === user.documento);
          if (p) {
            this.form.eps = p.eps || 'EPS Sanitas';
            this.form.universidad = p.universidad || '';
            this.form.carrera = p.carrera || 'Psicología';
            this.form.semestre = p.semestre || '';
            this.form.fechanacimiento = p.fechanacimiento || '';
          }
        }
      });
    }

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveUser() {
    if (!this.form.documento || !this.form.nombres || !this.form.apellidos || !this.form.idroles) {
      this.error = 'Por favor complete todos los campos obligatorios.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    if (this.isEditing && this.selectedUserId) {
      this.api.put(`usuarios/${this.selectedUserId}`, this.form).subscribe({
        next: () => {
          this.success = 'Usuario actualizado correctamente';
          this.fetchUsers();
          setTimeout(() => this.closeModal(), 1500);
          this.saving = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al actualizar el usuario';
          this.saving = false;
        }
      });
    } else {
      this.api.post('usuarios', this.form).subscribe({
        next: () => {
          this.success = 'Usuario creado correctamente';
          this.fetchUsers();
          setTimeout(() => this.closeModal(), 1500);
          this.saving = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el usuario';
          this.saving = false;
        }
      });
    }
  }

  toggleEstado(user: User) {
    const nuevoEstado = user.estado === 'A' ? 'I' : 'A';
    this.api.patch(`usuarios/${user.idusuarios}/estado`, { estado: nuevoEstado }).subscribe({
      next: () => {
        user.estado = nuevoEstado;
        this.applyFilter();
      },
      error: (err) => {
        alert('Error al actualizar el estado del usuario');
      }
    });
  }

  getRoleBadgeClass(idroles: number): string {
    switch (idroles) {
      case 2: return 'badge-sadmin';
      case 3: return 'badge-admin';
      case 4: return 'badge-planta';
      case 6: return 'badge-terapeuta';
      case 7: return 'badge-practicante';
      case 8: return 'badge-minuta';
      case 9: return 'badge-cajero';
      default: return 'badge-other';
    }
  }

  switchRole(newRole: string) {
    this.auth.switchActiveRole(newRole);
    window.location.reload();
  }

  logout() {
    this.auth.logout().subscribe(() => window.location.href = '/login');
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  get user() {
    return this.auth.getUser();
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }
}
