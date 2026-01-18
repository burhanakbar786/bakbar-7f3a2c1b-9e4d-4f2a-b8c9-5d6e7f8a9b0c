import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { NotificationComponent } from './notification.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let notificationSubject: BehaviorSubject<Notification | null>;

  beforeEach(async () => {
    notificationSubject = new BehaviorSubject<Notification | null>(null);

    mockNotificationService = {
      notification$: notificationSubject.asObservable(),
      clear: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct icon for success', () => {
    expect(component.getIconForType('success')).toBe('✓');
  });

  it('should return correct icon for error', () => {
    expect(component.getIconForType('error')).toBe('✕');
  });

  it('should return correct icon for info', () => {
    expect(component.getIconForType('info')).toBe('ℹ');
  });

  it('should return correct icon for warning', () => {
    expect(component.getIconForType('warning')).toBe('⚠');
  });

  it('should return correct color for success', () => {
    expect(component.getColorForType('success')).toBe('bg-green-500');
  });

  it('should return correct color for error', () => {
    expect(component.getColorForType('error')).toBe('bg-red-500');
  });

  it('should return correct color for info', () => {
    expect(component.getColorForType('info')).toBe('bg-blue-500');
  });

  it('should return correct color for warning', () => {
    expect(component.getColorForType('warning')).toBe('bg-yellow-500');
  });

  it('should call clear on close', () => {
    component.close();
    expect(mockNotificationService.clear).toHaveBeenCalled();
  });

  it('should display notification message', (done) => {
    const notification: Notification = {
      message: 'Test message',
      type: 'success',
    };

    notificationSubject.next(notification);
    fixture.detectChanges();

    setTimeout(() => {
      const compiled = fixture.nativeElement;
      const messageElement = compiled.querySelector('p');
      expect(messageElement?.textContent?.trim()).toBe('Test message');
      done();
    }, 100);
  });

  it('should not display when notification is null', () => {
    notificationSubject.next(null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const notificationElement = compiled.querySelector('.fixed');
    expect(notificationElement).toBeNull();
  });
});
