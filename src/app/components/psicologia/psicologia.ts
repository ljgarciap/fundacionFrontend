import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-psicologia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './psicologia.html',
  styleUrl: './psicologia.css'
})
export class Psicologia implements OnInit {
  user: any = null;
  residents: any[] = [];
  selectedResident: any = null;
  seguimientos: any[] = [];
  loading = true;
  showModal = false;
  
  formData = {
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
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadResidents();
  }

  loadResidents() {
    this.api.get('residentes').subscribe({
      next: (data) => {
        this.residents = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  viewSeguimientos(resident: any) {
    this.selectedResident = resident;
    this.api.get(`residentes/${resident.idresidentes}/seguimientos`).subscribe({
      next: (data) => this.seguimientos = data
    });
  }

  openModal() {
    if (!this.selectedResident) return;
    this.formData = {
      resumen: '',
      evaluacion: '',
      tecnicas: '',
      tarea: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitSeguimiento() {
    const body = {
      ...this.formData,
      idresidentes: this.selectedResident.idresidentes
    };

    this.api.post('seguimientos', body).subscribe({
      next: () => {
        this.closeModal();
        this.viewSeguimientos(this.selectedResident);
      },
      error: (err) => alert('Error: ' + err.error?.message)
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
