import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Venue {
  venueId: number;
  venueName: string;
  capacity?: number;
}

interface Event {
  eventId: number;
  eventName: string;
  eventDate: string;
  expectedParticipants?: number;
  createdDate?: string;
  status?: string;
  venue?: Venue;
}

interface PermissionApplication {
  applicationId: number;
  event: Event;
  uploadDate: string;
  permissionDoc: string;
  status: string;
  attachedDocuments?: PermissionDocument[];
}

interface PermissionDocument {
  documentId: number;
  applicationId: number;
  fileName: string;
  fileSize: number;
  uploadedDate: string;
  documentUrl: string;
}

@Component({
  selector: 'app-committee-dashboard',
  templateUrl: './committee-dashboard.component.html',
  styleUrls: ['./committee-dashboard.component.css']
})
export class CommitteeDashboardComponent implements OnInit, OnDestroy {
  private readonly BASE = 'http://localhost:8080';
  private pollInterval: any;
  private readonly POLL_MS = 30000;

  committeeId: number = 1;
  committeeName: string = 'Committee';
  committeeHead: string = '';

  // Data
  events: Event[] = [];
  applications: PermissionApplication[] = [];
  venues: Venue[] = [];
  approvers: any[] = [];
  venueAvailability: any[] = [];
  isLoadingAvailability: boolean = false;
  availabilityError: string = '';

  // UI State
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Active tab
  activeTab: 'applications' | 'events' | 'new-event' = 'applications';

  // New Event form
  newEvent = {
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    description: '',
    expectedParticipants: null as number | null,
    venueId: null as number | null
  };
  isSubmittingEvent: boolean = false;
  eventFormError: string = '';

  // Stats
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;

  // Details drawer
  showDetailsDrawer: boolean = false;
  selectedApp: PermissionApplication | null = null;

  // Targeted Approver Submit Modal
  showSubmitModal: boolean = false;
  selectedEventToSubmit: Event | null = null;
  selectedApproverId: number | null = null;

  // Document Upload
  selectedFiles: File[] = [];
  uploadingDocuments: boolean = false;
  selectedAppIdForUpload: number | null = null;
  documentUploadError: string = '';

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
    this.committeeId = this.authService.getCommitteeId();
    this.committeeName = this.authService.getUserName();
    this.loadCommitteeDetails();
    this.loadData();
    this.loadVenues();
    this.loadApprovers();
    // Auto-refresh disabled - users will manually refresh when needed
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = ''; // Clear previous errors

    // Load this committee's events
    this.http.get<Event[]>(`${this.BASE}/events/committee/${this.committeeId}`)
      .subscribe({
        next: (events) => {
          this.events = events || [];
          this.errorMessage = ''; // Clear error on success
          this.loadApplications();
        },
        error: (err) => {
          this.events = [];
          this.errorMessage = 'Failed to load events.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadApplications(): void {
    // Fetch all permission applications, then filter to this committee's events
    this.http.get<PermissionApplication[]>(`${this.BASE}/permissions`)
      .subscribe({
        next: (apps) => {
          const myEventIds = new Set(this.events.map(e => e.eventId));
          this.applications = (apps || []).filter(a => myEventIds.has(a.event?.eventId));
          this.errorMessage = ''; // Clear error on success
          this.calculateStats();
          this.isLoading = false;
        },
        error: (err) => {
          this.applications = [];
          this.errorMessage = 'Failed to load applications.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadVenues(): void {
    this.http.get<Venue[]>(`${this.BASE}/api/venues`)
      .subscribe({
        next: (venues) => {
          this.venues = venues || [];
          console.log('Venues loaded successfully:', this.venues);
        },
        error: (err) => {
          console.error('Failed to load venues:', err);
          this.venues = [];
        }
      });
  }

  loadApprovers(): void {
    this.http.get<any[]>(`${this.BASE}/api/approvers`)
      .subscribe({
        next: (approvers) => { this.approvers = approvers || []; },
        error: (err) => console.error('Could not load approvers', err)
      });
  }

  // Load venue availability for a specific date
  loadVenueAvailability(): void {
    if (!this.newEvent.eventDate) {
      this.venueAvailability = [];
      this.availabilityError = '';
      return;
    }

    this.isLoadingAvailability = true;
    this.availabilityError = '';
    console.log('Loading venue availability for date:', this.newEvent.eventDate);

    this.http.get<any[]>(`${this.BASE}/api/venues/availability`, {
      params: { date: this.newEvent.eventDate }
    }).subscribe({
      next: (availability) => {
        this.venueAvailability = availability || [];
        this.isLoadingAvailability = false;
        console.log('Venue availability loaded:', this.venueAvailability);
        if (this.venueAvailability.length === 0) {
          this.availabilityError = 'No venues available for this date.';
        }
      },
      error: (err) => {
        console.error('Failed to load venue availability:', err);
        this.isLoadingAvailability = false;
        this.availabilityError = 'Failed to load venue availability. Please try again.';
        this.venueAvailability = [];
      }
    });
  }

  loadCommitteeDetails(): void {
    this.http.get<any>(`${this.BASE}/api/committees/${this.committeeId}`)
      .subscribe({
        next: (committee) => {
          if (committee) {
            this.committeeName = committee.committeeName || this.committeeName;
            this.committeeHead = committee.headOfCommittee || '';
          }
        },
        error: (err) => console.error('Failed to load committee details:', err)
      });
  }

  calculateStats(): void {
    const s = (a: PermissionApplication) => (a.status || '').toUpperCase();
    this.pendingCount  = this.applications.filter(a => s(a) === 'PENDING' || s(a) === 'SUBMITTED').length;
    this.approvedCount = this.applications.filter(a => s(a) === 'APPROVED').length;
    this.rejectedCount = this.applications.filter(a => s(a) === 'REJECTED').length;
  }

  setTab(tab: 'applications' | 'events' | 'new-event'): void {
    this.activeTab = tab;
    this.eventFormError = '';
    this.errorMessage = '';
  }

  // ─── New Event ──────────────────────────
  // ─── Time Slot Selection ────────────────
  selectTimeSlot(slot: any, venueId: number): void {
    if (!slot.available) return;
    
    // If different venue, reset
    if (this.newEvent.venueId !== venueId) {
      this.newEvent.venueId = venueId;
      this.newEvent.startTime = slot.startTime;
      this.newEvent.endTime = slot.endTime;
      this.eventFormError = '';
      return;
    }

    // Toggle selection if exactly this single slot is clicked again
    if (this.newEvent.startTime === slot.startTime && this.newEvent.endTime === slot.endTime) {
      this.newEvent.startTime = '';
      this.newEvent.endTime = '';
      this.eventFormError = '';
      return;
    }

    // If no selection, just set it
    if (!this.newEvent.startTime || !this.newEvent.endTime) {
      this.newEvent.startTime = slot.startTime;
      this.newEvent.endTime = slot.endTime;
      this.eventFormError = '';
      return;
    }

    // Handle consecutive selection
    const currentStart = this.newEvent.startTime;
    const currentEnd = this.newEvent.endTime;
    const newStart = slot.startTime;
    const newEnd = slot.endTime;

    if (newStart === currentEnd) {
      // Append after
      const totalHours = this.calculateDurationHours(currentStart, newEnd);
      if (totalHours <= 3) {
        this.newEvent.endTime = newEnd;
      } else {
        // Exceeds 3 hours, start new selection with this slot
        this.newEvent.startTime = newStart;
        this.newEvent.endTime = newEnd;
      }
    } else if (newEnd === currentStart) {
      // Prepend before
      const totalHours = this.calculateDurationHours(newStart, currentEnd);
      if (totalHours <= 3) {
        this.newEvent.startTime = newStart;
      } else {
        // Exceeds 3 hours
        this.newEvent.startTime = newStart;
        this.newEvent.endTime = newEnd;
      }
    } else {
      // Not adjacent, start new selection
      this.newEvent.startTime = newStart;
      this.newEvent.endTime = newEnd;
    }
    
    this.eventFormError = '';
  }

  private calculateDurationHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const parse = (t: string) => {
      const p = t.split(':').map(Number);
      return p[0] + (p[1] || 0) / 60;
    };
    return parse(end) - parse(start);
  }

  isTimeSlotSelected(slot: any, venueId: number): boolean {
    if (this.newEvent.venueId !== venueId) return false;
    if (!this.newEvent.startTime || !this.newEvent.endTime) return false;
    return slot.startTime >= this.newEvent.startTime && slot.endTime <= this.newEvent.endTime;
  }

  submitNewEvent(): void {
    this.eventFormError = '';
    if (!this.newEvent.eventName.trim()) {
      this.eventFormError = 'Event name is required.'; return;
    }
    if (!this.newEvent.eventDate) {
      this.eventFormError = 'Event date is required.'; return;
    }

    // Validate that event date is not in the past
    const eventDate = new Date(this.newEvent.eventDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      this.eventFormError = 'Event date cannot be in the past. Please select a future date.'; 
      return;
    }

    // Validate time slots if venue is selected
    if (this.newEvent.venueId) {
      if (!this.newEvent.startTime) {
        this.eventFormError = 'Start time is required when a venue is selected.';
        return;
      }
      if (!this.newEvent.endTime) {
        this.eventFormError = 'End time is required when a venue is selected.';
        return;
      }
      if (this.newEvent.startTime >= this.newEvent.endTime) {
        this.eventFormError = 'End time must be after start time.';
        return;
      }
    }

    this.isSubmittingEvent = true;

    const payload: any = {
      eventName: this.newEvent.eventName,
      eventDate: this.newEvent.eventDate,
      description: this.newEvent.description,
      expectedParticipants: this.newEvent.expectedParticipants,
      status: 'Pending',
      committee: { id: this.committeeId }
    };

    if (this.newEvent.venueId) {
      payload.venue = { venueId: this.newEvent.venueId };
      payload.startTime = this.newEvent.startTime;
      payload.endTime = this.newEvent.endTime;
    }

    this.http.post<Event>(`${this.BASE}/events`, payload).subscribe({
      next: (createdEvent) => {
        this.isSubmittingEvent = false;
        this.successMessage = `Event "${createdEvent.eventName}" created successfully.`;
        this.newEvent = { eventName: '', eventDate: '', startTime: '', endTime: '', description: '', expectedParticipants: null, venueId: null };
        this.venueAvailability = [];
        this.loadData();
        this.setTab('events');
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.isSubmittingEvent = false;
        this.eventFormError = err.error?.message || 'Failed to create event. Please try again.';
        console.error(err);
      }
    });
  }

  // ─── Submit permission application ──────
  submitPermission(event: Event): void {
    this.selectedEventToSubmit = event;
    this.selectedApproverId = null;
    this.errorMessage = '';
    this.showSubmitModal = true;
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedEventToSubmit = null;
    this.selectedApproverId = null;
    this.selectedFiles = [];
    this.errorMessage = '';
  }

  confirmSubmitPermission(): void {
    if (!this.selectedEventToSubmit) return;
    if (!this.selectedApproverId) {
       this.errorMessage = 'Please select an approver.';
       setTimeout(() => this.errorMessage = '', 4000);
       return;
    }
    
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please attach at least one PDF document before submitting.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const event = this.selectedEventToSubmit;
    const approverId = this.selectedApproverId;

    // Create FormData with files, eventId, and approverId
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', event.eventId.toString());
    formData.append('approverId', approverId.toString());

    const isSubmitting = true;
    
    this.http.post<any>(
      `${this.BASE}/permissions/submit-with-documents`, formData
    ).subscribe({
      next: () => {
        this.successMessage = `Permission application with ${this.selectedFiles.length} document(s) submitted to approver for "${event.eventName}".`;
        this.loadData();
        this.closeSubmitModal();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to submit permission application with documents.';
        console.error(err);
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  hasApplication(event: Event): boolean {
    return this.applications.some(a => a.event?.eventId === event.eventId);
  }

  getApplicationForEvent(event: Event): PermissionApplication | undefined {
    return this.applications.find(a => a.event?.eventId === event.eventId);
  }

  // ─── Details drawer ──────────────────────
  openDetails(app: PermissionApplication): void {
    this.selectedApp = app;
    this.showDetailsDrawer = true;
  }

  closeDetails(): void {
    this.showDetailsDrawer = false;
    this.selectedApp = null;
  }

  // ─── Helpers ────────────────────────────
  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return 'badge-approved';
    if (s === 'REJECTED')  return 'badge-rejected';
    return 'badge-pending';
  }

  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ─── Document Management ────────────────────
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      // Only allow PDFs
      const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      if (validFiles.length === 0) {
        this.documentUploadError = 'Only PDF files are allowed.';
        setTimeout(() => this.documentUploadError = '', 4000);
        return;
      }
      this.selectedFiles = validFiles;
    }
  }

  uploadDocuments(applicationId: number): void {
    if (this.selectedFiles.length === 0) {
      this.documentUploadError = 'Please select at least one PDF file to upload.';
      setTimeout(() => this.documentUploadError = '', 4000);
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    this.uploadingDocuments = true;
    this.documentUploadError = '';

    this.http.post(
      `${this.BASE}/permissions/${applicationId}/upload-documents`,
      formData
    ).subscribe({
      next: () => {
        this.successMessage = `${this.selectedFiles.length} document(s) uploaded successfully.`;
        this.selectedFiles = [];
        this.selectedAppIdForUpload = null;
        this.uploadingDocuments = false;
        this.loadData();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.uploadingDocuments = false;
        this.documentUploadError = 'Failed to upload documents. Please try again.';
        console.error(err);
        setTimeout(() => this.documentUploadError = '', 4000);
      }
    });
  }

  downloadDocument(doc: PermissionDocument): void {
    if (!doc.documentUrl) {
      console.error('Document URL is missing');
      return;
    }
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = `${this.BASE}${doc.documentUrl}`;
    link.download = doc.fileName;
    link.click();
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
