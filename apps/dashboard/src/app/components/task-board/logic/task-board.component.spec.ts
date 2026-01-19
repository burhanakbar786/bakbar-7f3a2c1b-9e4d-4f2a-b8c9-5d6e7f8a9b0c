import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { TaskBoardComponent } from './task-board.component';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { TaskStatus, TaskPriority, ITask } from '@turbovets/data';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRouter: jest.Mocked<Router>;
  let currentUserSubject: BehaviorSubject<any>;

  const mockTasks: ITask[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      category: 'Work',
      userId: 1,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      category: 'Personal',
      userId: 1,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject({
      id: 1,
      email: 'test@test.com',
      role: { name: 'Owner' },
    });

    mockTaskService = {
      getTasks: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    } as any;

    mockAuthService = {
      currentUser$: currentUserSubject.asObservable(),
      getCurrentUser: jest.fn().mockReturnValue(currentUserSubject.value),
      logout: jest.fn(),
    } as any;

    mockNotificationService = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent, CommonModule, FormsModule, DragDropModule, HttpClientTestingModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', (done) => {
    mockTaskService.getTasks.mockReturnValue(of(mockTasks));
    
    component.ngOnInit();

    setTimeout(() => {
      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(component.tasks.length).toBe(2);
      done();
    }, 100);
  });

  it('should filter tasks by status', () => {
    component.tasks = mockTasks;
    component.applyFilters();

    expect(component.todoTasks.length).toBe(1);
    expect(component.inProgressTasks.length).toBe(1);
    expect(component.doneTasks.length).toBe(0);
  });

  it('should filter tasks by search query', () => {
    component.tasks = mockTasks;
    component.searchQuery = 'Task 1';
    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].title).toBe('Task 1');
  });

  it('should filter tasks by category', () => {
    component.tasks = mockTasks;
    component.selectedCategory = 'Work';
    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].category).toBe('Work');
  });

  it('should filter tasks by priority', () => {
    component.tasks = mockTasks;
    component.selectedPriority = TaskPriority.HIGH;
    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].priority).toBe(TaskPriority.HIGH);
  });

  it('should toggle dark mode', () => {
    const initialMode = component.darkMode;
    component.toggleDarkMode();
    expect(component.darkMode).toBe(!initialMode);
  });

  it('should calculate stats correctly', () => {
    component.tasks = mockTasks;
    component.applyFilters();

    expect(component.todoTasks.length).toBe(1);
    expect(component.inProgressTasks.length).toBe(1);
    expect(component.doneTasks.length).toBe(0);
  });

});
