import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-biometricos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './biometricos.html',
  styleUrl: './biometricos.css'
})
export class Biometricos implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  user: any = null;
  residenteId: number = 0;
  residente: any = null;
  ctx!: CanvasRenderingContext2D;
  isDrawing = false;
  loading = false;

  constructor(
    private api: Api,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.residenteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadResidente();
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
  }

  loadResidente() {
    this.api.get(`residentes/${this.residenteId}/history`).subscribe({
      next: (data) => {
        // Here we can get basic info if we had a /residentes/{id} endpoint
        // For now we just use the ID
      }
    });
  }

  // Signature Pad Logic (Native Canvas)
  startDrawing(event: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    const pos = this.getPos(event);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();
    const pos = this.getPos(event);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  getPos(event: MouseEvent | TouchEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    } else {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
  }

  saveSignature() {
    const image = this.canvas.nativeElement.toDataURL('image/png');
    this.loading = true;
    this.api.post(`residentes/${this.residenteId}/biometrics`, {
      type: 'firma',
      image: image
    }).subscribe({
      next: () => {
        alert('Firma guardada correctamente');
        this.loading = false;
      },
      error: () => {
        alert('Error al guardar la firma');
        this.loading = false;
      }
    });
  }

  onFingerprintSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'huella');
    formData.append('image', file);

    this.loading = true;
    this.api.post(`residentes/${this.residenteId}/biometrics`, formData).subscribe({
      next: () => {
        alert('Huella cargada correctamente');
        this.loading = false;
      },
      error: () => {
        alert('Error al cargar la huella');
        this.loading = false;
      }
    });
  }

  switchRole(role: string) {
    this.auth.switchActiveRole(role);
    window.location.reload();
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login'])
    });
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  isDarkTheme(): boolean {
    return document.body.classList.contains('dark-theme');
  }
}
