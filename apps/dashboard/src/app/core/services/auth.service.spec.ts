import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginDto } from '@turbovets/data';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully and store token', (done) => {
    const credentials: LoginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

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

    service.login(credentials).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('auth_token')).toBe('test-token');
      expect(localStorage.getItem('current_user')).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
  });

  it('should set current user on login', (done) => {
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

    service.currentUser$.subscribe((user) => {
      if (user) {
        expect(user.id).toBe(1);
        expect(user.email).toBe('test@test.com');
        done();
      }
    });

    service.login({ email: 'test@test.com', password: 'password123' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(mockResponse);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('current_user', JSON.stringify({ id: 1 }));

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('should return true when authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return false when not authenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return token', () => {
    localStorage.setItem('auth_token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null when no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should load user from storage on init', () => {
    const mockUser = { id: 1, email: 'test@test.com', role: 'Owner' };
    localStorage.setItem('current_user', JSON.stringify(mockUser));

    const newService = new AuthService({} as any, mockRouter);

    expect(newService.getCurrentUser()).toEqual(mockUser);
  });
});
