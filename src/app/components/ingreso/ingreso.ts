import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingreso.html',
  styleUrl: './ingreso.css'
})
export class Ingreso implements OnInit {
  @Output() onBack = new EventEmitter<void>();
  currentStep = 1;
  ingresoForm!: FormGroup;
  loading = false;
  success = false;
  newResidenteId: number | null = null;
  isOffline = false;
  ciudades: string[] = ['PIEDECUESTA'];
  user: any = null;
  hasDraft = false;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.ingresoForm = this.fb.group({
      resident_data: this.fb.group({
        nomfund: ['FUNDACIÓN JESÚS ES MI ROCA', Validators.required],
        pension: [null, Validators.required],
        uniforme: [null, Validators.required],
        fechai: [new Date().toISOString().split('T')[0], Validators.required],
        nombresr: ['', Validators.required],
        apellidosr: ['', Validators.required],
        fechan: ['', Validators.required],
        eps: [''],
        tipo_sanguineo: ['O+', Validators.required],
        documentor: ['', Validators.required],
        expedicionr: ['PIEDECUESTA'],
        tipodocumento: ['C.C'],
        telefono: [''],
        celular: [''],
        direccionf: [''],
        ciudad: ['PIEDECUESTA'],
        estudios: ['Ninguno'],
        profesion: [''],
        email: [''],
        estadocivil: ['Soltero'],
        conyuge: [''],
        padre: [''],
        madre: [''],
        estado: ['A']
      }),
      guardian_data: this.fb.group({
        nombres: ['', Validators.required],
        apellidos: ['', Validators.required],
        documento: ['', Validators.required],
        expedicion: ['PIEDECUESTA'],
        telefono: ['', Validators.required],
        email: ['', [Validators.email]],
        parentesco: ['', Validators.required],
        autorizacion: ['SI']
      }),
      history_data: this.fb.group({
        motivoi: ['Primer Ingreso'],
        tiempoadiccion: [0],
        medidatiempo: ['Años'],
        drogasusadas: [''],
        problemas: ['No'],
        carcel: ['No'],
        fundaciones: [''],
        motivos: [''],
        referido: ['']
      }),
      medical_data: this.fb.group({
        enfermedades: [''],
        fechaexamen: [''],
        estadosalud: ['Excelente'],
        vacunas: ['Si'],
        diagnosis: [''],
        medicamentos: [''],
        alergias: [''],
        hospitalizado: ['No'],
        descripcion: ['']
      })
    });

    this.fetchCiudades();
    this.checkDraft();
  }

  checkDraft() {
    const saved = localStorage.getItem('ingreso_draft');
    if (saved) {
      this.hasDraft = true;
    }

    // Subscribe to form value changes to autosave draft
    this.ingresoForm.valueChanges.subscribe(val => {
      // Don't overwrite if hasDraft banner is showing (to let user resume or discard first)
      if (!this.hasDraft) {
        localStorage.setItem('ingreso_draft', JSON.stringify({
          formValue: val,
          step: this.currentStep
        }));
      }
    });
  }

  resumeDraft() {
    const saved = localStorage.getItem('ingreso_draft');
    if (saved) {
      try {
        const { formValue, step } = JSON.parse(saved);
        if (formValue) {
          this.ingresoForm.patchValue(formValue);
        }
        this.currentStep = step || 1;
      } catch (e) {
        console.error('Error restoring draft', e);
      }
    }
    this.hasDraft = false;
    this.cdr.detectChanges();
  }

  discardDraft() {
    localStorage.removeItem('ingreso_draft');
    this.hasDraft = false;
    this.cdr.detectChanges();
  }

  saveStepDraft() {
    localStorage.setItem('ingreso_draft', JSON.stringify({
      formValue: this.ingresoForm.value,
      step: this.currentStep
    }));
  }

  fetchCiudades() {
    this.api.get('ciudades').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize names
          const sorted = data.map((c: string) => c.trim().toUpperCase());
          // Keep PIEDECUESTA first if it exists, otherwise add it
          const index = sorted.indexOf('PIEDECUESTA');
          if (index > -1) {
            sorted.splice(index, 1);
          }
          this.ciudades = ['PIEDECUESTA', ...sorted];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching ciudades', err);
        this.cdr.detectChanges();
      }
    });
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.saveStepDraft();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.saveStepDraft();
    }
  }

  formatNumberInput(fieldName: 'pension' | 'uniforme', event: any) {
    const input = event.target;
    let val = input.value;
    
    // Remove all non-digits
    let raw = val.replace(/\D/g, '');
    
    if (raw === '') {
      this.ingresoForm.get('resident_data')?.get(fieldName)?.setValue(null, { emitEvent: false });
      return;
    }
    
    // Format with thousands separator dots
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Update the control value cosmetically
    this.ingresoForm.get('resident_data')?.get(fieldName)?.setValue(formatted, { emitEvent: false });
  }

  onSubmit() {
    if (this.ingresoForm.invalid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.loading = true;

    // Clone and sanitize cosmetic dots before posting
    const body = JSON.parse(JSON.stringify(this.ingresoForm.value));
    if (body.resident_data) {
      if (body.resident_data.pension !== null && body.resident_data.pension !== undefined) {
        const rawStr = String(body.resident_data.pension).replace(/\D/g, '');
        body.resident_data.pension = rawStr ? Number(rawStr) : null;
      }
      if (body.resident_data.uniforme !== null && body.resident_data.uniforme !== undefined) {
        const rawStr = String(body.resident_data.uniforme).replace(/\D/g, '');
        body.resident_data.uniforme = rawStr ? Number(rawStr) : null;
      }
    }

    this.api.post('ingresos', body).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        localStorage.removeItem('ingreso_draft');
        if (res.residente) {
          this.newResidenteId = res.residente.idresidentes;
        } else {
          this.isOffline = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error in ingreso', err);
        alert('Error al registrar el ingreso. ' + (err.error?.message || ''));
        this.cdr.detectChanges();
      }
    });
  }

  downloadPdf() {
    if (!this.newResidenteId) return;
    
    const url = `${this.api.baseUrl}/ingresos/${this.newResidenteId}/pdf?token=${this.auth.getToken()}`;
    window.open(url, '_blank');
  }

  goToDashboard() {
    this.onBack.emit();
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
