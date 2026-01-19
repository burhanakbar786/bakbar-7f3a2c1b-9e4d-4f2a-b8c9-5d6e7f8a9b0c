import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { TaskEditorComponent } from './task-editor.component';
import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskStatus, TaskPriority, ITask } from '@turbovets/data';

describe('TaskEditorComponent', () => {
  let component: TaskEditorComponent;
  let fixture: ComponentFixture<TaskEditorComponent>;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockTask: ITask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    category: 'Work',
    userId: 1,
    organizationId: 1,
    dueDate: new Date('2026-01-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTaskService = {
      createTask: jest.fn(),
      updateTask: jest.fn(),
    } as any;

    mockNotificationService = {
      success: jest.fn(),
      error: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TaskEditorComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form for new task', () => {
    component.task = null;
    component.ngOnInit();

    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('status')?.value).toBe(TaskStatus.TODO);
  });

  it('should initialize with task data for editing', () => {
    component.task = mockTask;
    component.ngOnInit();

    expect(component.taskForm.get('title')?.value).toBe('Test Task');
    expect(component.taskForm.get('description')?.value).toBe('Test Description');
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.HIGH);
  });

  it('should show error on create failure', (done) => {
    mockTaskService.createTask.mockReturnValue(throwError(() => ({ error: { message: 'Error' } })));

    component.task = null;
    component.ngOnInit();
    component.taskForm.patchValue({ title: 'New Task' });

    component.onSubmit();

    setTimeout(() => {
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(component.loading).toBe(false);
      done();
    }, 100);
  });

  it('should emit cancelled event', () => {
    const cancelSpy = jest.spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should not submit invalid form', () => {
    component.ngOnInit();
    component.taskForm.patchValue({ title: '' });
    component.onSubmit();
    expect(mockTaskService.createTask).not.toHaveBeenCalled();
  });

  it('should format due date correctly', () => {
    component.task = mockTask;
    component.ngOnInit();
    const dueDateValue = component.taskForm.get('dueDate')?.value;
    expect(dueDateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
