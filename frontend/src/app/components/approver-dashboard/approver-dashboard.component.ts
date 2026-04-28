import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Event {
  eventId: number;
  eventName: string;
  eventDate: string;
  venue?: { venueName: string };
  committee?: { committeeName: string };
  expectedParticipants?: number;
  description?: string;
}

interface PermissionApplication {
  applicationId: number;
  event: Event;
  uploadDate: string;
  permissionDoc: string;
  status: string;
}

@Component({
  selector: 'app-approver-dashboard',
  templateUrl: './approver-dashboard.component.html',
  styleUrls: ['./approver-dashboard.component.css']
})
export class ApproverDashboardComponent implements OnInit, OnDestroy {
  // Read approver ID from sessionStorage (set at login)
  approverId: number = 1;
  approverName: string = 'Approver';

  // Auto-refresh polling interval handle
  private pollInterval: any;
  private readonly POLL_MS = 30000; // 30 seconds

  // Backend base URL – matches Spring Boot (no /api prefix for /permissions)
  private readonly BASE = 'http://localhost:8080';

  applications: PermissionApplication[] = [];
  filteredApplications: PermissionApplication[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Filter & search
  searchQuery: string = '';
  activeFilter: string = 'ALL';

  // Modal state
  showRejectModal: boolean = false;
  showDetailsDrawer: boolean = false;
  selectedApp: PermissionApplication | null = null;
  rejectRemarks: string = '';
  modalError: string = '';
  isSubmitting: boolean = false;

  // Stats
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // CRITICAL: Validate authentication before loading any data
    this.authService.validateAuthOnInit().subscribe({
      next: (isValid) => {
        if (!isValid) {
          console.warn('Authentication validation failed on page refresh');
          this.router.navigate(['/login']);
          return;
        }

        // Auth is valid, proceed with initialization
        this.initializeDashboard();
      },
      error: (err) => {
        console.warn('Authentication validation error, attempting to load with cached session:', err);
        // Even if validation fails, if user has a session token, try to load
        // The actual API calls will fail if the token is truly invalid
        if (this.authService.isAuthenticated()) {
          this.initializeDashboard();
        } else {
          console.error('No valid session found');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private initializeDashboard(): void {
    this.approverId = this.authService.getApproverId();
    this.approverName = this.authService.getUserName();
    this.loadApplications();
    // Auto-refresh disabled - users will manually refresh when needed
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // Endpoint: GET /permissions/approver/{approverId}
    this.http.get<PermissionApplication[]>(`${this.BASE}/permissions/approver/${this.approverId}`)
      .subscribe({
        next: (data) => {
          this.applications = data || [];
          this.applyFilter();
          this.calculateStats();
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load targeted applications.';
          this.isLoading = false;
          console.error('Load error:', err);
        }
      });
  }

  calculateStats(): void {
    const s = (a: PermissionApplication) => (a.status || '').toUpperCase();
    this.pendingCount  = this.applications.filter(a => s(a) === 'PENDING' || s(a) === 'SUBMITTED').length;
    this.approvedCount = this.applications.filter(a => s(a) === 'APPROVED').length;
    this.rejectedCount = this.applications.filter(a => s(a) === 'REJECTED').length;
  }

  applyFilter(): void {
    let result = [...this.applications];

    if (this.activeFilter === 'PENDING') {
      result = result.filter(a => {
        const s = (a.status || '').toUpperCase();
        return s === 'PENDING' || s === 'SUBMITTED';
      });
    } else if (this.activeFilter !== 'ALL') {
      result = result.filter(a => (a.status || '').toUpperCase() === this.activeFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.event?.eventName?.toLowerCase().includes(q) ||
        a.event?.committee?.committeeName?.toLowerCase().includes(q) ||
        a.applicationId?.toString().includes(q)
      );
    }

    this.filteredApplications = result;
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  // --- Approve ---
  openApproveConfirm(app: PermissionApplication): void {
    if (confirm(`Approve application #${app.applicationId} for "${app.event?.eventName}"?`)) {
      this.submitDecision(app, 'APPROVED', 'Approved by reviewer.');
    }
  }

  // --- Reject modal ---
  openRejectModal(app: PermissionApplication): void {
    this.selectedApp = app;
    this.rejectRemarks = '';
    this.modalError = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedApp = null;
    this.rejectRemarks = '';
    this.modalError = '';
  }

  submitRejection(): void {
    if (!this.rejectRemarks.trim()) {
      this.modalError = 'Please provide a reason for rejection.';
      return;
    }
    if (this.selectedApp) {
      this.submitDecision(this.selectedApp, 'REJECTED', this.rejectRemarks);
      this.closeRejectModal();
    }
  }

  submitDecision(app: PermissionApplication, status: string, remarks: string): void {
    this.isSubmitting = true;
    const payload = { approvalStatus: status, remarks };

    // Endpoint: POST /permissions/{applicationId}/approve/{approverId}
    this.http.post(
      `${this.BASE}/permissions/${app.applicationId}/approve/${this.approverId}`,
      payload
    ).subscribe({
      next: () => {
        this.successMessage = `Application #${app.applicationId} has been ${status.toLowerCase()} successfully.`;
        this.isSubmitting = false;
        this.loadApplications();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = `Failed to ${status.toLowerCase()} application. Please try again.`;
        this.isSubmitting = false;
        console.error('Decision error:', err);
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  // --- Details drawer ---
  openDetails(app: PermissionApplication): void {
    this.selectedApp = app;
    this.showDetailsDrawer = true;
  }

  closeDetails(): void {
    this.showDetailsDrawer = false;
    this.selectedApp = null;
  }

  // --- Helpers ---
  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return 'badge-approved';
    if (s === 'REJECTED') return 'badge-rejected';
    return 'badge-pending';
  }

  isPending(status: string): boolean {
    const s = (status || '').toUpperCase();
    return s === 'PENDING' || s === 'SUBMITTED';
  }

  isEventSoon(eventDate: string | undefined): boolean {
    if (!eventDate) return false;
    const diff = new Date(eventDate).getTime() - Date.now();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ✅ Parse permission_doc string and return document URLs
  getDocumentUrls(permissionDoc: string): {filename: string, url: string}[] {
    if (!permissionDoc || permissionDoc.trim() === '') {
      return [];
    }
    
    // Split by comma to get individual document paths
    const paths = permissionDoc.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    return paths.map(path => {
      // Extract filename from path (e.g., "/documents/uuid.pdf" -> "uuid.pdf")
      const filename = path.split('/').pop() || path;
      return {
        filename: filename,
        url: `${this.BASE}/permissions/documents/download/${filename}`
      };
    });
  }
}
