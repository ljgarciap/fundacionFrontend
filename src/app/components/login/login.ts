import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  documento = '';
  password = '';
  loading = false;
  error = '';

  // Multi-role selector state
  showRoleSelection = false;
  availableRoles: string[] = [];
  pendingResponse: any = null;

  constructor(
    private api: Api,
    private router: Router
  ) {}

  onLogin(event: Event) {
    event.preventDefault();
    if (!this.documento || !this.password) return;

    this.loading = true;
    this.error = '';

    this.api.post('login', { documento: this.documento, password: this.password }).subscribe({
      next: (res: any) => {
        if (res.token) {
          const roles = res.user.roles || [res.user.role];
          if (roles.length > 1) {
            // Store response and show role selector card
            this.pendingResponse = res;
            this.availableRoles = roles;
            this.showRoleSelection = true;
            this.loading = false;
          } else {
            // Single role, log in directly
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Código de usuario o contraseña incorrectos';
      }
    });
  }

  selectRole(role: string) {
    if (this.pendingResponse) {
      const res = this.pendingResponse;
      res.user.role = role; // Set the chosen active role for the session
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      this.router.navigate(['/dashboard']);
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }
}
