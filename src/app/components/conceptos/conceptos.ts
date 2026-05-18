import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-conceptos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './conceptos.html',
  styleUrl: './conceptos.css'
})
export class Conceptos implements OnInit {
  user: any = null;
  loading = false;
  saving = false;
  deleting = false;

  conceptos: any[] = [];
  tipologias: any[] = [];
  searchQuery = '';

  // Nuevo concepto (inline)
  nuevoNombre = '';

  // Edición inline
  editingId: number | null = null;
  editNombre = '';

  // Confirm delete
  showDeleteModal = false;
  deletingConcepto: any = null;
  deleteError = '';

  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.load();
    this.loadTipologias();
  }

  load() {
    this.loading = true;
    this.api.get('conceptos').subscribe({
      next: (res: any) => { this.conceptos = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadTipologias() {
    this.api.get('tipologias').subscribe({
      next: (res: any) => this.tipologias = res,
      error: () => {}
    });
  }

  get filtered() {
    if (!this.searchQuery) return this.conceptos;
    return this.conceptos.filter(c =>
      c.nombre?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  addConcepto() {
    if (!this.nuevoNombre.trim()) return;
    this.saving = true;
    this.api.post('conceptos', { nombre: this.nuevoNombre.trim() }).subscribe({
      next: () => {
        this.nuevoNombre = '';
        this.saving = false;
        this.load();
      },
      error: (err: any) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || 'El concepto ya existe o es inválido'));
      }
    });
  }

  startEdit(c: any) {
    this.editingId = c.idconceptos;
    this.editNombre = c.nombre;
  }

  cancelEdit() {
    this.editingId = null;
    this.editNombre = '';
  }

  saveEdit(c: any) {
    if (!this.editNombre.trim() || this.editNombre === c.nombre) {
      this.cancelEdit();
      return;
    }
    this.saving = true;
    this.api.put(`conceptos/${c.idconceptos}`, { nombre: this.editNombre.trim() }).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: (err: any) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || 'No se pudo actualizar'));
      }
    });
  }

  confirmDelete(c: any) {
    this.deletingConcepto = c;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  doDelete() {
    if (!this.deletingConcepto) return;
    this.deleting = true;
    this.deleteError = '';
    this.api.delete(`conceptos/${this.deletingConcepto.idconceptos}`).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deletingConcepto = null;
        this.load();
      },
      error: (err: any) => {
        this.deleting = false;
        this.deleteError = err.error?.message || 'No se pudo eliminar el concepto';
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
