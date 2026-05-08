import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AdminService } from '../../services/admin.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  // Tab Navigation
  activeTab: string = 'overview';

  // Forms
  committeeForm!: FormGroup;
  approverForm!: FormGroup;
  venueForm!: FormGroup;
  showCommitteeForm = false;
  showApproverForm = false;
  showVenueForm = false;
  isEditingVenue = false;
  editingVenueId: number | null = null;
  isLoading = false;
  // Committee editing
  editCommitteeForm!: FormGroup;
  isEditingCommittee = false;
  editingCommitteeId: number | null = null;
  // Approver editing
  editApproverForm!: FormGroup;
  isEditingApprover = false;
  editingApproverId: number | null = null;
  // Stats
  stats: any;

  // Tables
  committeeColumns: string[] = ['name', 'head', 'email', 'actions'];
  committeeDataSource = new MatTableDataSource<any>();

  approverColumns: string[] = ['name', 'role', 'email', 'actions'];
  approverDataSource = new MatTableDataSource<any>();

  venueColumns: string[] = ['name', 'location', 'capacity', 'facilities', 'status', 'actions'];
  venueDataSource = new MatTableDataSource<any>();

  eventColumns: string[] = ['name', 'date', 'committee'];
  eventDataSource = new MatTableDataSource<any>();

  venues: any[] = [];

  // Charts
  approvalChart: any;
  venueChart: any;

  // Getters for template
  get committeeList(): any[] {
    return this.committeeDataSource.data;
  }

  get approverList(): any[] {
    return this.approverDataSource.data;
  }

  get venueList(): any[] {
    return this.venueDataSource.data;
  }

  get eventList(): any[] {
    return this.eventDataSource.data;
  }

  constructor(
    private adminService: AdminService, 
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadStats();
    this.loadCommittees();
    this.loadApprovers();
    this.loadVenues();
    this.loadEvents();
  }

  // Email domain validation patterns (Copied from RegisterComponent)
  readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|co\.uk|io)$/;

  initForms(): void {
    this.committeeForm = this.fb.group({
      committeeName: ['', [Validators.required, Validators.minLength(3)]],
      facultyInChargeName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(this.EMAIL_PATTERN)
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.editCommitteeForm = this.fb.group({
      committeeName: ['', [Validators.required, Validators.minLength(3)]],
      headOfCommittee: ['', [Validators.required, Validators.minLength(3)]],
      contactEmail: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(this.EMAIL_PATTERN)
      ]],
      password: ['']  // Optional — only sent if filled
    });

    this.editApproverForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(this.EMAIL_PATTERN)
      ]],
      role: ['', Validators.required],
      password: ['']  // Optional — only sent if filled
    });

    this.approverForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(this.EMAIL_PATTERN)
      ]],
      role: ['APPROVER', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.venueForm = this.fb.group({
      venueName: ['', [Validators.required, Validators.minLength(3)]],
      venueLocation: ['', [Validators.required]],
      capacity: [0, [Validators.required, Validators.min(1)]],
      available: [true],
      facilities: ['']
    });
  }

  ngAfterViewInit(): void {
    this.loadChartData();
  }

  setTab(tabName: string): void {
    this.activeTab = tabName;
    this.showCommitteeForm = false;
    this.showApproverForm = false;
    this.showVenueForm = false;
  }

  loadStats(): void {
    this.adminService.getStats().subscribe(data => this.stats = data);
  }

  loadChartData(): void {
    this.adminService.getChartData().subscribe(data => {
      this.createApprovalChart(data.approvalAnalytics);
      this.createVenueChart(data.venueUsage);
    });
  }

  createApprovalChart(data: any): void {
    const ctx = document.getElementById('approvalChart') as HTMLCanvasElement;
    if (this.approvalChart) this.approvalChart.destroy();
    
    this.approvalChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createVenueChart(data: any): void {
    const ctx = document.getElementById('venueChart') as HTMLCanvasElement;
    if (this.venueChart) this.venueChart.destroy();
    
    this.venueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Number of Bookings',
          data: Object.values(data),
          backgroundColor: '#3498db'
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  loadCommittees(): void {
    this.adminService.getAllCommittees().subscribe(data => {
      this.committeeDataSource.data = data;
    });
  }

  loadApprovers(): void {
    this.adminService.getAllApprovers().subscribe(data => {
      this.approverDataSource.data = data;
    });
  }

  loadVenues(): void {
    this.adminService.getAllVenues().subscribe(data => {
      this.venues = data;
      this.venueDataSource.data = data;
    });
  }

  loadEvents(): void {
    this.adminService.getAllEvents().subscribe(data => {
      this.eventDataSource.data = data.filter(e => e.status === 'APPROVED');
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.trim()) {
      this.adminService.searchCommittees(filterValue.trim()).subscribe(data => {
        this.committeeDataSource.data = data;
      });
    } else {
      this.loadCommittees();
    }
  }


  onDeleteCommittee(id: number): void {
    if (confirm('Are you sure you want to permanently delete this committee? This action cannot be undone.')) {
      this.adminService.deleteCommittee(id).subscribe({
        next: () => {
          this.snackBar.open('Committee deleted successfully', 'Close', { duration: 3000 });
          this.loadCommittees();
          this.loadStats();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete committee', 'Close', { duration: 5000 });
          console.error('Delete committee error:', err);
        }
      });
    }
  }

  toggleCommitteeForm(): void {
    this.showCommitteeForm = !this.showCommitteeForm;
    if (this.showCommitteeForm) {
      this.showApproverForm = false;
      this.cancelEditCommittee();
    }
  }

  toggleApproverForm(): void {
    this.showApproverForm = !this.showApproverForm;
    if (this.showApproverForm) this.showCommitteeForm = false;
  }

  onRegisterCommittee(): void {
    if (this.committeeForm.invalid) return;

    this.isLoading = true;
    const registerData = {
      email: this.committeeForm.value.email.trim(),
      password: this.committeeForm.value.password,
      role: 'COMMITTEE' as const,
      committeeName: this.committeeForm.value.committeeName.trim(),
      facultyInChargeName: this.committeeForm.value.facultyInChargeName.trim()
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        this.showCommitteeForm = false;
        this.committeeForm.reset();
        this.snackBar.open('Committee registered successfully', 'Close', { duration: 3000 });
        this.loadCommittees();
        this.loadStats();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Registration failed', 'Close', { duration: 5000 });
        console.error('Registration error:', err);
      }
    });
  }

  onRegisterApprover(): void {
    if (this.approverForm.invalid) return;

    this.isLoading = true;
    const registerData = {
      email: this.approverForm.value.email.trim(),
      password: this.approverForm.value.password,
      role: this.approverForm.value.role as 'APPROVER' | 'ADMIN',
      name: this.approverForm.value.name.trim()
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        this.showApproverForm = false;
        this.approverForm.reset();
        this.snackBar.open('Approver registered successfully', 'Close', { duration: 3000 });
        this.loadApprovers();
        this.loadStats();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Registration failed', 'Close', { duration: 5000 });
        console.error('Registration error:', err);
      }
    });
  }

  openCommitteeDialog(): void {
    this.toggleCommitteeForm();
  }

  openApproverDialog(): void {
    this.toggleApproverForm();
  }

  applyVenueFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.trim()) {
      this.adminService.searchVenues(filterValue.trim()).subscribe(data => {
        this.venueDataSource.data = data;
      });
    } else {
      this.loadVenues();
    }
  }

  applyApproverFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.trim()) {
      this.adminService.searchApprovers(filterValue.trim()).subscribe(data => {
        this.approverDataSource.data = data;
      });
    } else {
      this.loadApprovers();
    }
  }

  editApprover(approver: any): void {
    this.isEditingApprover = true;
    this.editingApproverId = approver.approverId;
    this.editApproverForm.patchValue({
      name: approver.name,
      email: approver.email,
      role: approver.role,
      password: ''
    });
    this.showApproverForm = false;
    setTimeout(() => {
      document.querySelector('.edit-approver-form-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelEditApprover(): void {
    this.isEditingApprover = false;
    this.editingApproverId = null;
    this.editApproverForm.reset();
  }

  onEditApproverSubmit(): void {
    if (this.editApproverForm.invalid || !this.editingApproverId) return;

    this.isLoading = true;
    const formVal = this.editApproverForm.value;

    const patchData: any = {
      name: formVal.name?.trim(),
      email: formVal.email?.trim(),
      role: formVal.role?.trim()
    };
    if (formVal.password && formVal.password.trim()) {
      patchData.password = formVal.password.trim();
    }

    this.adminService.patchApprover(this.editingApproverId, patchData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Approver updated successfully', 'Close', { duration: 3000 });
        this.cancelEditApprover();
        this.loadApprovers();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Failed to update approver', 'Close', { duration: 5000 });
        console.error('Patch approver error:', err);
      }
    });
  }

  editCommittee(committee: any): void {
    this.isEditingCommittee = true;
    this.editingCommitteeId = committee.id;
    this.editCommitteeForm.patchValue({
      committeeName: committee.committeeName,
      headOfCommittee: committee.headOfCommittee,
      contactEmail: committee.contactEmail,
      password: ''
    });
    // Close create form if open
    this.showCommitteeForm = false;
    setTimeout(() => {
      document.querySelector('.edit-committee-form-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelEditCommittee(): void {
    this.isEditingCommittee = false;
    this.editingCommitteeId = null;
    this.editCommitteeForm.reset();
  }

  onEditCommitteeSubmit(): void {
    if (this.editCommitteeForm.invalid || !this.editingCommitteeId) return;

    this.isLoading = true;
    const formVal = this.editCommitteeForm.value;

    // Only include non-empty fields (PATCH semantics)
    const patchData: any = {
      committeeName: formVal.committeeName?.trim(),
      headOfCommittee: formVal.headOfCommittee?.trim(),
      contactEmail: formVal.contactEmail?.trim()
    };
    if (formVal.password && formVal.password.trim()) {
      patchData.password = formVal.password.trim();
    }

    this.adminService.patchCommittee(this.editingCommitteeId, patchData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Committee updated successfully', 'Close', { duration: 3000 });
        this.cancelEditCommittee();
        this.loadCommittees();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Failed to update committee', 'Close', { duration: 5000 });
        console.error('Patch committee error:', err);
      }
    });
  }

  toggleVenueForm(): void {
    this.showVenueForm = !this.showVenueForm;
    if (this.showVenueForm) {
      this.showCommitteeForm = false;
      this.showApproverForm = false;
    } else {
      this.resetVenueForm();
    }
  }

  resetVenueForm(): void {
    this.isEditingVenue = false;
    this.editingVenueId = null;
    this.venueForm.reset({ available: true, capacity: 0 });
  }

  onVenueSubmit(): void {
    if (this.venueForm.invalid) return;

    this.isLoading = true;
    const venueData = this.venueForm.value;

    if (this.isEditingVenue && this.editingVenueId) {
      this.adminService.patchVenue(this.editingVenueId, venueData).subscribe({
        next: () => {
          this.handleVenueSuccess('Venue updated successfully');
        },
        error: (err) => this.handleVenueError(err)
      });
    } else {
      this.adminService.createVenue(venueData).subscribe({
        next: () => {
          this.handleVenueSuccess('Venue created successfully');
        },
        error: (err) => this.handleVenueError(err)
      });
    }
  }

  private handleVenueSuccess(message: string): void {
    this.isLoading = false;
    this.showVenueForm = false;
    this.resetVenueForm();
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.loadVenues();
    this.loadStats();
  }

  private handleVenueError(err: any): void {
    this.isLoading = false;
    this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 5000 });
    console.error('Venue error:', err);
  }

  openVenueDialog(): void {
    this.toggleVenueForm();
  }

  editVenue(venue: any): void {
    this.isEditingVenue = true;
    this.editingVenueId = venue.venueId;
    this.venueForm.patchValue({
      venueName: venue.venueName,
      venueLocation: venue.venueLocation,
      capacity: venue.capacity,
      available: venue.available,
      facilities: venue.facilities
    });
    this.showVenueForm = true;
    this.showCommitteeForm = false;
    this.showApproverForm = false;
    
    // Scroll to form
    setTimeout(() => {
      document.querySelector('.registration-form-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  deleteVenue(id: number): void {
    if (confirm('Are you sure you want to delete this venue?')) {
      this.adminService.deleteVenue(id).subscribe({
        next: () => {
          this.snackBar.open('Venue deleted successfully', 'Close', { duration: 3000 });
          this.loadVenues();
          this.loadStats();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete venue', 'Close', { duration: 5000 });
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
