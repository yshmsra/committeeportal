import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Venue {
  venueId: number;
  venueName: string;
  capacity?: number;
  venueLocation?: string;
}

interface CommitteeEvent {
  eventId: number;
  eventName: string;
  eventDate: string;
  expectedParticipants?: number;
  createdDate?: string;
  status?: string;
  venue?: Venue;
  description?: string;
  startTime?: string;
  endTime?: string;
}

interface Approval {
  approvalId: number;
  approvalStatus: string;
  approvalDate: string;
  remarks?: string;
}

interface PermissionApplication {
  applicationId: number;
  event: CommitteeEvent;
  uploadDate: string;
  permissionDoc: string;
  status: string;
  remarks?: string;
  approvals?: Approval[];
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
  private readonly BASE = ''; // Use relative path for production
  private pollInterval: any;
  private readonly POLL_MS = 30000;

  committeeId: number = 1;
  committeeName: string = 'Committee';
  committeeHead: string = '';

  // Data
  events: CommitteeEvent[] = [];
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

  // Event Details Modal
  showEventDetailsModal: boolean = false;
  selectedEvent: CommitteeEvent | null = null;
  isEditingEvent: boolean = false;
  editEventData: any = null;
  eventDetailsError: string = '';
  isEditingAfterRejection: boolean = false; // Track if editing after rejection to re-upload docs

  // Filters
  eventStatusFilter: string = ''; // 'UPCOMING', 'COMPLETED', '' for all
  approvalStatusFilter: string = ''; // 'PENDING', 'APPROVED', 'REJECTED', '' for all
  filteredApprovals: Approval[] = [];

  // Targeted Approver Submit Modal
  showSubmitModal: boolean = false;
  selectedEventToSubmit: CommitteeEvent | null = null;
  selectedApproverId: number | null = null;
  isSubmittingPermission: boolean = false;

  // Document Upload
  selectedFiles: File[] = [];
  uploadingDocuments: boolean = false;
  selectedAppIdForUpload: number | null = null;
  documentUploadError: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
    this.http.get<CommitteeEvent[]>(`${this.BASE}/api/events/committee/${this.committeeId}`)
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
    this.http.get<PermissionApplication[]>(`${this.BASE}/api/permissions`)
      .subscribe({
        next: (apps) => {
          const myEventIds = new Set(this.events.map(e => e.eventId));
          this.applications = (apps || []).filter(a => myEventIds.has(a.event?.eventId));
          
          // Fetch approvals for each application to get approver feedback
          this.applications.forEach(app => {
            this.http.get<Approval[]>(`${this.BASE}/api/approvals/application/${app.applicationId}`)
              .subscribe({
                next: (approvals) => {
                  app.approvals = approvals || [];
                },
                error: (err) => {
                  console.error('Failed to load approvals for application', app.applicationId, err);
                  app.approvals = [];
                }
              });
          });
          
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

  // Load only available venues for new event creation
  loadAvailableVenues(): void {
    this.http.get<Venue[]>(`${this.BASE}/api/venues/available`)
      .subscribe({
        next: (venues) => {
          this.venues = venues || [];
          console.log('Available venues loaded:', this.venues);
        },
        error: (err) => {
          console.error('Failed to load available venues:', err);
          // Fallback to all venues
          this.loadVenues();
        }
      });
  }

  // Load venue details by ID
  loadVenueDetails(venueId: number): void {
    this.http.get<Venue>(`${this.BASE}/api/venues/${venueId}`)
      .subscribe({
        next: (venue) => {
          console.log('Venue details loaded:', venue);
          // Update selected event venue with full details
          if (this.selectedEvent && this.selectedEvent.venue?.venueId === venueId) {
            this.selectedEvent.venue = venue;
          }
        },
        error: (err) => {
          console.error('Failed to load venue details:', err);
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

  // ─── Event Management (NEW ENDPOINTS) ─────────────────
  loadEventDetails(eventId: number): void {
    this.http.get<CommitteeEvent>(`${this.BASE}/api/events/${eventId}`)
      .subscribe({
        next: (event) => {
          this.selectedEvent = event;
          if (event.venue?.venueId) {
            this.loadVenueDetails(event.venue.venueId);
          }
        },
        error: (err) => {
          this.eventDetailsError = 'Failed to load event details.';
          console.error(err);
        }
      });
  }

  // Load events by status filter
  loadEventsByStatus(status: string): void {
    if (!status) {
      this.eventStatusFilter = '';
      this.loadData();
      return;
    }

    this.eventStatusFilter = status;
    this.isLoading = true;
    
    this.http.get<CommitteeEvent[]>(`${this.BASE}/api/events/committee/${this.committeeId}`)
      .subscribe({
        next: (events) => {
          const filtered = (events || []).filter(e => 
            (e.status || '').toUpperCase() === status.toUpperCase()
          );
          this.events = filtered;
          this.isLoading = false;
        },
        error: (err) => {
          this.eventStatusFilter = '';
          this.errorMessage = 'Failed to filter events by status.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  updateEvent(eventId: number, eventData: any): void {
    this.http.put<CommitteeEvent>(`${this.BASE}/api/events/${eventId}`, eventData)
      .subscribe({
        next: (updatedEvent) => {
          this.successMessage = `Event "${updatedEvent.eventName}" updated successfully.`;
          this.closeEventDetailsModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.eventDetailsError = 'Failed to update event.';
          console.error(err);
          setTimeout(() => this.eventDetailsError = '', 4000);
        }
      });
  }

  // Delete/Cancel event
  deleteEvent(eventId: number, eventName: string): void {
    if (!confirm(`Are you sure you want to cancel the event "${eventName}"?`)) {
      return;
    }

    this.http.delete(`${this.BASE}/api/events/${eventId}`)
      .subscribe({
        next: () => {
          this.successMessage = `Event "${eventName}" has been cancelled.`;
          this.closeEventDetailsModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.errorMessage = 'Failed to cancel event.';
          console.error(err);
          setTimeout(() => this.errorMessage = '', 4000);
        }
      });
  }

  // Delete only the application
  deleteApplication(appId: number): void {
    if (!confirm('Are you sure you want to delete this permission application? You will need to apply again.')) {
      return;
    }

    this.http.delete(`${this.BASE}/api/permissions/${appId}`)
      .subscribe({
        next: () => {
          this.successMessage = 'Application deleted successfully. You can now edit the event or re-apply.';
          this.closeDetails();
          this.loadData();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.errorMessage = 'Failed to delete application.';
          console.error(err);
          setTimeout(() => this.errorMessage = '', 4000);
        }
      });
  }

  // ─── Approval Status Filtering (NEW ENDPOINTS) ────────
  // Load approvals filtered by status
  loadApprovalsByStatus(status: string): void {
    if (!status) {
      this.approvalStatusFilter = '';
      this.loadApplications();
      return;
    }

    this.approvalStatusFilter = status;
    this.isLoading = true;

    this.http.get<Approval[]>(`${this.BASE}/api/approvals/status/${status}`)
      .subscribe({
        next: (approvals) => {
          // Filter approvals that belong to this committee's applications
          const myAppIds = new Set(this.applications.map(a => a.applicationId));
          this.filteredApprovals = (approvals || []).filter(a => 
            myAppIds.has((a as any).applicationId)
          );
          this.isLoading = false;
        },
        error: (err) => {
          this.approvalStatusFilter = '';
          this.errorMessage = 'Failed to filter approvals.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // ─── Permission Application Details (NEW ENDPOINT) ────
  // Load individual permission application details
  loadPermissionApplicationDetails(appId: number): void {
    this.http.get<PermissionApplication>(`${this.BASE}/api/permissions/${appId}`)
      .subscribe({
        next: (app) => {
          this.selectedApp = app;
          // Also fetch approvals for this application
          if (app.approvals === undefined) {
            this.http.get<Approval[]>(`${this.BASE}/api/approvals/application/${app.applicationId}`)
              .subscribe({
                next: (approvals) => {
                  if (this.selectedApp) {
                    this.selectedApp.approvals = approvals;
                    this.cdr.detectChanges();
                  }
                }
              });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load permission application details:', err);
        }
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

    this.http.post<CommitteeEvent>(`${this.BASE}/api/events`, payload).subscribe({
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
  submitPermission(committeeEvent: CommitteeEvent, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('Opening submit permission modal for event:', committeeEvent);
    
    // reset current view state to avoid stale data
    this.showDetailsDrawer = false;
    this.showEventDetailsModal = false;
    
    // Explicitly set the data
    this.selectedEventToSubmit = { ...committeeEvent }; 
    this.selectedApproverId = null;
    this.selectedFiles = [];
    this.errorMessage = '';
    
    // Trigger modal visibility with a slight delay to ensure it doesn't catch the same click event
    setTimeout(() => {
      this.showSubmitModal = true;
      this.cdr.detectChanges();
      console.log('showSubmitModal is now:', this.showSubmitModal);
    }, 50);
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedEventToSubmit = null;
    this.selectedApproverId = null;
    this.selectedFiles = [];
    this.errorMessage = '';
    this.isSubmittingPermission = false;
    this.cdr.detectChanges();
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

    // Prevent multiple submissions
    if (this.isSubmittingPermission) {
      return;
    }

    this.isSubmittingPermission = true;
    const event = this.selectedEventToSubmit;
    const approverId = this.selectedApproverId;

    // Create FormData with files, eventId, and approverId
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', event.eventId.toString());
    formData.append('approverId', approverId.toString());
    
    this.http.post<any>(
      `${this.BASE}/permissions/submit-with-documents`, formData
    ).subscribe({
      next: () => {
        this.successMessage = `Permission application with ${this.selectedFiles.length} document(s) submitted to approver for "${event.eventName}".`;
        this.loadData();
        this.closeSubmitModal();
        this.isSubmittingPermission = false;
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to submit permission application with documents.';
        this.isSubmittingPermission = false;
        console.error(err);
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  hasApplication(committeeEvent: CommitteeEvent): boolean {
    return this.applications.some(a => a.event?.eventId === committeeEvent.eventId);
  }

  getApplicationForEvent(committeeEvent: CommitteeEvent): PermissionApplication | undefined {
    return this.applications.find(a => a.event?.eventId === committeeEvent.eventId);
  }

  // ─── Details drawer ──────────────────────
  openDetails(app: PermissionApplication): void {
    // Reset other views
    this.showSubmitModal = false;
    this.showEventDetailsModal = false;
    
    this.loadPermissionApplicationDetails(app.applicationId);
    this.showDetailsDrawer = true;
    this.cdr.detectChanges();
  }

  // Handle actions for rejected applications from the details drawer
  handleRejectedApplicationAction(action: 'edit' | 'delete', app: PermissionApplication, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (action === 'delete') {
      if (!confirm('Are you sure you want to cancel this event? This will delete both the application and the event.')) {
        return;
      }
      // First delete the application
      this.http.delete(`${this.BASE}/api/permissions/${app.applicationId}`)
        .subscribe({
          next: () => {
            // Then delete the event
            this.deleteEvent(app.event.eventId, app.event.eventName);
            this.closeDetails();
          },
          error: (err) => {
            this.errorMessage = 'Failed to delete application. Cannot delete event.';
            console.error(err);
          }
        });
    } else if (action === 'edit') {
      console.log('Action: edit for rejected application', app);
      
      // 1. Set the event and edit data immediately
      this.selectedEvent = { ...app.event };
      this.isEditingAfterRejection = true;
      this.isEditingEvent = true;
      this.editEventData = {
        eventName: app.event.eventName,
        eventDate: app.event.eventDate,
        expectedParticipants: app.event.expectedParticipants,
        description: app.event.description,
        status: app.event.status
      };
      
      // 2. Delete the old application immediately so they can apply fresh
      this.http.delete(`${this.BASE}/api/permissions/${app.applicationId}`)
        .subscribe({
          next: () => {
            console.log('Old application deleted for fresh re-application');
            this.successMessage = 'Old application cleared. You can now edit and re-apply.';
            this.loadData();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => console.error('Error clearing old application', err)
        });

      // 3. Close the details drawer and open the edit modal
      this.closeDetails();
      
      setTimeout(() => {
        console.log('Opening event details modal in edit mode');
        this.showEventDetailsModal = true;
        this.cdr.detectChanges();
      }, 100);
    }
  }

  closeDetails(): void {
    this.showDetailsDrawer = false;
    this.selectedApp = null;
    this.cdr.detectChanges();
  }

  // ─── Event Details Modal ─────────────────
  openEventDetailsModal(committeeEvent: CommitteeEvent): void {
    this.loadEventDetails(committeeEvent.eventId);
    this.isEditingEvent = false;
    this.editEventData = null;
    this.eventDetailsError = '';
    this.showEventDetailsModal = true;
  }

  closeEventDetailsModal(): void {
    this.showEventDetailsModal = false;
    this.selectedEvent = null;
    this.isEditingEvent = false;
    this.editEventData = null;
    this.eventDetailsError = '';
    this.isEditingAfterRejection = false;
  }

  // ─── Check if event can be edited ─────────────────────
  canEditEvent(eventId: number): boolean {
    // Find the application for this event
    const app = this.applications.find(a => a.event?.eventId === eventId);
    
    // If no application exists, event can be edited (not yet submitted)
    if (!app) {
      return true;
    }

    // If application is REJECTED, event can be edited
    if ((app.status || '').toUpperCase() === 'REJECTED') {
      return true;
    }

    // Otherwise (PENDING or APPROVED), event cannot be edited
    return false;
  }

  // ─── Check if this is editing after rejection ─────────────
  isRejectedApplication(eventId: number): boolean {
    const app = this.applications.find(a => a.event?.eventId === eventId);
    return !!(app && (app.status || '').toUpperCase() === 'REJECTED');
  }

  startEditingEvent(): void {
    if (!this.selectedEvent) return;
    
    // Check if this event has a rejected application
    this.isEditingAfterRejection = this.isRejectedApplication(this.selectedEvent.eventId);
    
    this.isEditingEvent = true;
    this.editEventData = {
      eventName: this.selectedEvent.eventName,
      eventDate: this.selectedEvent.eventDate,
      expectedParticipants: this.selectedEvent.expectedParticipants,
      description: this.selectedEvent.description,
      status: this.selectedEvent.status
    };
  }

  cancelEditingEvent(): void {
    this.isEditingEvent = false;
    this.editEventData = null;
    this.eventDetailsError = '';
    this.isEditingAfterRejection = false;
    this.selectedFiles = [];
  }

  saveEventChanges(): void {
    if (!this.selectedEvent || !this.editEventData) return;
    
    // Validate
    if (!this.editEventData.eventName?.trim()) {
      this.eventDetailsError = 'Event name is required.';
      return;
    }

    // If editing after rejection, require documents
    if (this.isEditingAfterRejection && this.selectedFiles.length === 0) {
      this.eventDetailsError = 'Please upload at least one document for re-submission.';
      return;
    }

    // Update the event
    this.updateEvent(this.selectedEvent.eventId, this.editEventData);

  }

  // ─── Re-submit rejected application with new documents ─────
  resubmitRejectedApplication(app: PermissionApplication): void {
    if (this.selectedFiles.length === 0) {
      this.eventDetailsError = 'No documents to submit.';
      return;
    }

    const formData = new FormData();
    formData.append('applicationId', app.applicationId.toString());
    
    // Add files
    this.selectedFiles.forEach(file => {
      formData.append('documents', file);
    });

    this.uploadingDocuments = true;
    this.http.post<any>(`${this.BASE}/api/permissions/${app.applicationId}/resubmit`, formData)
      .subscribe({
        next: () => {
          this.successMessage = 'Application re-submitted successfully with updated documents.';
          this.uploadingDocuments = false;
          this.selectedFiles = [];
          this.cancelEditingEvent();
          this.closeEventDetailsModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (err) => {
          this.uploadingDocuments = false;
          this.eventDetailsError = err.error?.message || 'Failed to re-submit application.';
          console.error(err);
        }
      });
  }

  // ─── Remove selected file ────────────────────────────────
  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  // ─── Filter Handlers ────────────────────
  onApprovalStatusFilterChange(event: any): void {
    const value = (event.target as HTMLSelectElement).value;
    this.approvalStatusFilter = value;
    if (value) {
      this.loadApprovalsByStatus(value);
    } else {
      this.loadApplications();
    }
  }

  onEventStatusFilterChange(event: any): void {
    const value = (event.target as HTMLSelectElement).value;
    this.eventStatusFilter = value;
    if (value) {
      this.loadEventsByStatus(value);
    } else {
      this.loadData();
    }
  }
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

  // Get tomorrow's date in YYYY-MM-DD format (minimum allowed date for events)
  getMinEventDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Tomorrow
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
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
