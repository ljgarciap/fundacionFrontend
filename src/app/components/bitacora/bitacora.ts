import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './bitacora.html',
  styleUrl: './bitacora.css'
})
export class Bitacora implements OnInit {
  user: any = null;
  logs: any[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  
  // Filtering and Searching
  searchQuery = '';
  selectedMethod = '';
  selectedStatus = '';
  selectedLog: any = null;

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
    let url = `bitacora?page=${page}`;
    
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }
    if (this.selectedMethod) {
      url += `&method=${this.selectedMethod}`;
    }
    if (this.selectedStatus) {
      url += `&status=${this.selectedStatus}`;
    }

    this.api.get(url).subscribe({
      next: (response: any) => {
        this.logs = response.data;
        this.currentPage = response.current_page;
        this.totalPages = response.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  searchLogs() {
    this.loadLogs(1);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedMethod = '';
    this.selectedStatus = '';
    this.loadLogs(1);
  }

  viewLogDetails(log: any) {
    this.selectedLog = log;
  }

  closeLogDetails() {
    this.selectedLog = null;
  }

  formatJson(jsonStr: string): string {
    if (!jsonStr) return 'N/A';
    try {
      // If it is a string representation, parse it first
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400 && status < 500) return 'status-warning';
    if (status >= 500) return 'status-danger';
    return 'status-info';
  }

  getMethodClass(method: string): string {
    switch (method?.toUpperCase()) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      default: return 'method-other';
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
