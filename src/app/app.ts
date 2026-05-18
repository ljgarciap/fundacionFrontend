import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineManager } from './services/offline-manager';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Fundacion Rebuild');

  constructor(private offlineManager: OfflineManager) {}

  ngOnInit() {
    // Listen for online events to sync
    fromEvent(window, 'online').subscribe(() => {
      console.log('Online! Syncing...');
      this.offlineManager.checkForEvents().subscribe();
    });

    // Check on startup too
    if (navigator.onLine) {
      this.offlineManager.checkForEvents().subscribe();
    }
  }
}
