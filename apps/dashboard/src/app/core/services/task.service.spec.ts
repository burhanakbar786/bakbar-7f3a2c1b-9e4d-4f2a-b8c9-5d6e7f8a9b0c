import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority, ITask } from '@turbovets/data';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: ITask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    category: 'Work',
    userId: 1,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all tasks', (done) => {
    const mockTasks = [mockTask];

    service.getTasks().subscribe((tasks) => {
      expect(tasks).toEqual(mockTasks);
      expect(tasks.length).toBe(1);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('should get tasks with filters', (done) => {
    const filters = { status: TaskStatus.TODO, priority: TaskPriority.HIGH };

    service.getTasks(filters).subscribe((tasks) => {
      expect(tasks).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.apiUrl}/tasks` &&
             request.params.has('status') &&
             request.params.has('priority');
    });
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should get single task by id', (done) => {
    const taskId = 1;

    service.getTask(taskId).subscribe((task) => {
      expect(task).toEqual(mockTask);
      expect(task.id).toBe(taskId);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/${taskId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('should create new task', (done) => {
    const createDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      category: 'Work',
    };

    service.createTask(createDto).subscribe((task) => {
      expect(task).toBeTruthy();
      expect(task.title).toBe(createDto.title);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush({ ...mockTask, ...createDto });
  });

  it('should update existing task', (done) => {
    const taskId = 1;
    const updateDto: UpdateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.IN_PROGRESS,
    };

    service.updateTask(taskId, updateDto).subscribe((task) => {
      expect(task).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/${taskId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateDto);
    req.flush({ ...mockTask, ...updateDto });
  });

  it('should delete task', (done) => {
    const taskId = 1;

    service.deleteTask(taskId).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/${taskId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle empty filters gracefully', (done) => {
    service.getTasks({}).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('should handle null filters', (done) => {
    service.getTasks(undefined).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    req.flush([]);
  });
});
