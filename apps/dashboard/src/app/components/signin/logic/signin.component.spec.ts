import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SigninComponent } from './signin.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockNotificationService = {
      success: jest.fn(),
      error: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [SigninComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with pre-filled credentials', () => {
    expect(component.loginForm.get('email')?.value).toBe('owner@turbovets.com');
    expect(component.loginForm.get('password')?.value).toBe('Password123!');
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({ email: '', password: '' });
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should successfully login and navigate to dashboard', (done) => {
    const mockResponse = {
      access_token: 'test-token',
      user: {
        id: 1,
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Owner',
        organizationId: 1,
      },
    };

    mockAuthService.login.mockReturnValue(of(mockResponse));

    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password123',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(mockNotificationService.success).toHaveBeenCalledWith('Welcome back!');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    }, 100);
  });

  it('should show error notification on login failure', (done) => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    mockAuthService.login.mockReturnValue(throwError(() => errorResponse));

    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'wrongpassword',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.loading).toBe(false);
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should set loading state during login', () => {
    mockAuthService.login.mockReturnValue(of({} as any));
    component.onSubmit();
    expect(component.loading).toBe(true);
  });
});
