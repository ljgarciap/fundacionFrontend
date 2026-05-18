import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-minuta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './minuta.html',
  styleUrl: './minuta.css'
})
export class Minuta implements OnInit {
  user: any = null;
  minutas: any[] = [];
  visitantesUnicos: any[] = [];
  filteredVisitantes: any[] = [];
  residents: any[] = [];
  loading = true;
  searchQuery = '';
  page = 1;
  lastPage = 1;
  showDropdown = false;

  showModal = false;
  formData = {
    fecha: new Date().toISOString().split('T')[0],
    visitante: '',
    cedula: '',
    asunto: '',
    idresidentes: ''
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadMinutas();
    this.loadResidents();
    this.loadVisitantesUnicos();
  }

  loadMinutas() {
    this.loading = true;
    const url = `minutas?page=${this.page}&search=${encodeURIComponent(this.searchQuery)}`;
    this.api.get(url).subscribe({
      next: (res: any) => {
        this.minutas = res.data;
        this.lastPage = res.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (data: any) => {
        this.residents = data;
      }
    });
  }

  loadVisitantesUnicos() {
    this.api.get('minutas/visitantes').subscribe({
      next: (data: any) => {
        this.visitantesUnicos = data;
      }
    });
  }

  onSearchChange() {
    this.page = 1;
    this.loadMinutas();
  }

  onVisitanteInput() {
    const term = this.formData.visitante.toLowerCase();
    if (!term) {
      this.filteredVisitantes = [];
      this.showDropdown = false;
      return;
    }

    this.filteredVisitantes = this.visitantesUnicos.filter(v => 
      v.visitante.toLowerCase().includes(term) || v.cedula.includes(term)
    ).slice(0, 5); // Max 5 suggestions

    this.showDropdown = this.filteredVisitantes.length > 0;
  }

  selectVisitante(v: any) {
    this.formData.visitante = v.visitante;
    this.formData.cedula = v.cedula;
    this.showDropdown = false;
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadMinutas();
    }
  }

  openModal() {
    this.showModal = true;
    this.formData = {
      fecha: new Date().toISOString().split('T')[0],
      visitante: '',
      cedula: '',
      asunto: '',
      idresidentes: ''
    };
    this.showDropdown = false;
  }

  closeModal() {
    this.showModal = false;
  }

  submitMinuta() {
    this.api.post('minutas', this.formData).subscribe({
      next: () => {
        this.closeModal();
        this.loadMinutas();
        this.loadVisitantesUnicos(); // Recargar autocompletar
      },
      error: (err) => alert('Error al registrar visita: ' + (err.error?.message || err.message))
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
