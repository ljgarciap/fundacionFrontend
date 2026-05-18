import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bitacora.html',
  styleUrl: './bitacora.css'
})
export class Bitacora implements OnInit {
  user: any = null;
  logs: any[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.loadLogs();
  }

  loadLogs(page: number = 1) {
    this.loading = true;
    this.api.get(`bitacora?page=\${page}`).subscribe({
      next: (response: any) => {
        this.logs = response.data;
        this.currentPage = response.current_page;
        this.totalPages = response.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  formatDetails(details: string): string {
    try {
      const obj = JSON.parse(details);
      return Object.entries(obj)
        .map(([key, val]) => `\${key}: \${val}`)
        .join(', ');
    } catch {
      return details;
    }
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
