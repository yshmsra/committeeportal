import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin/dashboard';
  private committeeUrl = 'http://localhost:8080/api/committees';
  private venueUrl = 'http://localhost:8080/api/venues';
  private eventUrl = 'http://localhost:8080/api/events';
  private approverUrl = 'http://localhost:8080/api/approvers';

  constructor(private http: HttpClient) { }

  // Dashboard Stats
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getChartData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/charts`);
  }

  // Committee Management
  getAllCommittees(): Observable<any[]> {
    return this.http.get<any[]>(this.committeeUrl);
  }

  createCommittee(committee: any): Observable<any> {
    return this.http.post(this.committeeUrl, committee);
  }

  updateCommittee(id: number, committee: any): Observable<any> {
    return this.http.put(`${this.committeeUrl}/${id}`, committee);
  }

  patchCommittee(id: number, fields: any): Observable<any> {
    return this.http.patch(`${this.committeeUrl}/${id}`, fields);
  }

  searchCommittees(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.committeeUrl}/search?name=${name}`);
  }

  deleteCommittee(id: number): Observable<any> {
    return this.http.delete(`${this.committeeUrl}/${id}`);
  }

  // Approver Management
  getAllApprovers(): Observable<any[]> {
    return this.http.get<any[]>(this.approverUrl);
  }

  createApprover(approver: any): Observable<any> {
    return this.http.post(this.approverUrl, approver);
  }

  searchApprovers(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.approverUrl}/search?name=${name}`);
  }

  patchApprover(id: number, fields: any): Observable<any> {
    return this.http.patch(`${this.approverUrl}/${id}`, fields);
  }

  // Event Management
  getAllEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.eventUrl);
  }

  // Venue Management
  getAllVenues(): Observable<any[]> {
    return this.http.get<any[]>(this.venueUrl);
  }

  createVenue(venue: any): Observable<any> {
    return this.http.post(this.venueUrl, venue);
  }

  updateVenue(id: number, venue: any): Observable<any> {
    return this.http.put(`${this.venueUrl}/${id}`, venue);
  }

  deleteVenue(id: number): Observable<any> {
    return this.http.delete(`${this.venueUrl}/${id}`);
  }

  searchVenues(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.venueUrl}/name/${name}`);
  }

  patchVenue(id: number, fields: any): Observable<any> {
    return this.http.patch(`${this.venueUrl}/${id}`, fields);
  }
}
