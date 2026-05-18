import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface StoredRequest {
  url: string;
  type: string;
  data: any;
  time: number;
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineManager {
  private STORAGE_KEY = 'offline_requests';

  constructor(private http: HttpClient) { }

  async storeRequest(url: string, type: string, data: any) {
    const action: StoredRequest = {
      url: url,
      type: type,
      data: data,
      time: new Date().getTime(),
      id: Math.random().toString(36).substring(2, 15)
    };

    const storedActions = await this.getStoredActions();
    storedActions.push(action);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedActions));
  }

  async getStoredActions(): Promise<StoredRequest[]> {
    const res = localStorage.getItem(this.STORAGE_KEY);
    return res ? JSON.parse(res) : [];
  }

  checkForEvents(): Observable<any> {
    return from(this.getStoredActions()).pipe(
      switchMap(actions => {
        if (actions.length > 0) {
          return this.sendRequests(actions).pipe(
            map(() => {
              localStorage.removeItem(this.STORAGE_KEY);
              return true;
            })
          );
        } else {
          return of(false);
        }
      })
    );
  }

  private sendRequests(actions: StoredRequest[]): Observable<any> {
    const requests = actions.map(action => {
      if (action.type === 'POST') {
        return this.http.post(action.url, action.data);
      } else if (action.type === 'PUT') {
        return this.http.put(action.url, action.data);
      } else {
        return this.http.delete(action.url);
      }
    });

    return from(requests).pipe(
      switchMap(req => req),
      catchError(err => {
        console.error('Error syncing offline request', err);
        return of(null);
      })
    );
  }
}
