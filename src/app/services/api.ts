import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OfflineManager } from './offline-manager';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private offlineManager: OfflineManager
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleApiError(err: any): Observable<never> {
    if (err.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return throwError(() => err);
  }

  get(path: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${path}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('API GET Error', err);
        return this.handleApiError(err);
      })
    );
  }

  post(path: string, data: any): Observable<any> {
    if (!navigator.onLine) {
      this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'POST', data);
      return of({ offline: true, message: 'Solicitud guardada localmente' });
    }

    return this.http.post(`${this.apiUrl}/${path}`, data, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (err.status === 0) {
          this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'POST', data);
          return of({ offline: true, message: 'Solicitud guardada localmente por falla de red' });
        }
        return this.handleApiError(err);
      })
    );
  }

  patch(path: string, data: any): Observable<any> {
    if (!navigator.onLine) {
      this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'PATCH', data);
      return of({ offline: true, message: 'Solicitud guardada localmente' });
    }

    return this.http.patch(`${this.apiUrl}/${path}`, data, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (err.status === 0) {
          this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'PATCH', data);
          return of({ offline: true, message: 'Solicitud guardada localmente por falla de red' });
        }
        return this.handleApiError(err);
      })
    );
  }

  put(path: string, data: any): Observable<any> {
    if (!navigator.onLine) {
      this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'PUT', data);
      return of({ offline: true, message: 'Solicitud guardada localmente' });
    }

    return this.http.put(`${this.apiUrl}/${path}`, data, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (err.status === 0) {
          this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'PUT', data);
          return of({ offline: true, message: 'Solicitud guardada localmente por falla de red' });
        }
        return this.handleApiError(err);
      })
    );
  }

  delete(path: string): Observable<any> {
    if (!navigator.onLine) {
      this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'DELETE', null);
      return of({ offline: true, message: 'Solicitud guardada localmente' });
    }

    return this.http.delete(`${this.apiUrl}/${path}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (err.status === 0) {
          this.offlineManager.storeRequest(`${this.apiUrl}/${path}`, 'DELETE', null);
          return of({ offline: true, message: 'Solicitud guardada localmente por falla de red' });
        }
        return this.handleApiError(err);
      })
    );
  }

  get baseUrl(): string {
    return this.apiUrl;
  }

  getBaseUrl(): string {
    return this.apiUrl;
  }
}
