import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITask, CreateTaskDto, UpdateTaskDto } from '@turbovets/data';
import { environment } from '../../../environments/environment';

/**
 * Task Service
 * 
 * Handles all task-related API operations with JWT authentication.
 * Provides CRUD operations for tasks with automatic token injection via interceptor.
 * 
 * API Integration:
 * - All requests automatically include JWT token (via AuthInterceptor)
 * - Supports filtering, sorting, and pagination
 * - Returns typed observables for type safety
 * 
 * @Injectable - Available application-wide as singleton
 */
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Retrieves all tasks accessible to the current user.
   * 
   * RBAC Filtering:
   * - Backend automatically scopes results based on user role
   * - Owners see all tasks in their org + child orgs
   * - Admins see tasks in their org only
   * - Viewers see tasks in their org (read-only)
   * 
   * @param filters - Optional query params (status, priority, search)
   * @returns Observable of task array
   */
  getTasks(filters?: any): Observable<ITask[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<ITask[]>(this.apiUrl, { params });
  }

  getTask(id: number): Observable<ITask> {
    return this.http.get<ITask>(`${this.apiUrl}/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<ITask> {
    return this.http.post<ITask>(this.apiUrl, task);
  }

  updateTask(id: number, task: UpdateTaskDto): Observable<ITask> {
    return this.http.patch<ITask>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
