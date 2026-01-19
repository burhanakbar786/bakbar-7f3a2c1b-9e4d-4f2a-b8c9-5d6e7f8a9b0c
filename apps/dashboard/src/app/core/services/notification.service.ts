import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Notification Type Configuration
 * Defines the structure for toast notifications
 */
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // Auto-dismiss time in milliseconds
}

/**
 * Notification Service
 * 
 * Manages application-wide toast notifications for user feedback.
 * Provides auto-dismissing alerts for success, error, info, and warning states.
 * 
 * Usage Pattern:
 * - Success: Task created, updated, deleted
 * - Error: API failures, validation errors
 * - Info: General information messages
 * - Warning: Cautionary alerts
 * 
 * Features:
 * - Auto-dismiss with configurable duration
 * - Manual dismiss capability
 * - Type-specific styling via notification component
 * 
 * @Injectable - Available application-wide as singleton
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /** Reactive stream for notification state - components subscribe to this */
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  /**
   * Displays a success notification (green)
   * @param message - Success message to display
   * @param duration - Auto-dismiss time (default: 3000ms)
   */
  success(message: string, duration = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Displays an error notification (red)
   * @param message - Error message to display
   * @param duration - Auto-dismiss time (default: 5000ms - longer for errors)
   */
  error(message: string, duration = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Displays an info notification (blue)
   * @param message - Info message to display
   * @param duration - Auto-dismiss time (default: 3000ms)
   */
  info(message: string, duration = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Displays a warning notification (yellow)
   * @param message - Warning message to display
   * @param duration - Auto-dismiss time (default: 4000ms)
   */
  warning(message: string, duration = 4000): void {
    this.show({ message, type: 'warning', duration });
  }

  private show(notification: Notification): void {
    this.notificationSubject.next(notification);

    if (notification.duration) {
      setTimeout(() => {
        this.notificationSubject.next(null);
      }, notification.duration);
    }
  }

  clear(): void {
    this.notificationSubject.next(null);
  }
}
