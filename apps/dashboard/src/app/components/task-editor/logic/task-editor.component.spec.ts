import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
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
      imports: [TaskEditorComponent, ReactiveFormsModule],
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

  it('should validate required fields', () => {
    component.ngOnInit();
    const titleControl = component.taskForm.get('title');
    
    titleControl?.setValue('');
    expect(titleControl?.hasError('required')).toBe(true);

    titleControl?.setValue('Valid Title');
    expect(titleControl?.hasError('required')).toBe(false);
  });

  it('should create new task successfully', (done) => {
    const newTask = { ...mockTask, id: 2 };
    mockTaskService.createTask.mockReturnValue(of(newTask));

    component.task = null;
    component.ngOnInit();
    component.taskForm.patchValue({
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      category: 'Work',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(mockTaskService.createTask).toHaveBeenCalled();
      expect(mockNotificationService.success).toHaveBeenCalledWith('Task created successfully');
      expect(component.saved.emit).toBeDefined();
      done();
    }, 100);
  });

  it('should update existing task successfully', (done) => {
    mockTaskService.updateTask.mockReturnValue(of(mockTask));

    component.task = mockTask;
    component.ngOnInit();
    component.taskForm.patchValue({ title: 'Updated Task' });

    component.onSubmit();

    setTimeout(() => {
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(mockTask.id, expect.any(Object));
      expect(mockNotificationService.success).toHaveBeenCalledWith('Task updated successfully');
      done();
    }, 100);
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

  it('should emit deleted event', () => {
    const deleteSpy = jest.spyOn(component.deleted, 'emit');
    component.task = mockTask;
    component.onDelete();
    expect(deleteSpy).toHaveBeenCalledWith(mockTask);
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
