import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { ITask, TaskStatus, TaskPriority } from '@app/data';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

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

  describe('getTasks', () => {
    it('should fetch tasks from API', () => {
      const mockTasks: ITask[] = [
        {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          category: 'Work',
          userId: 1,
          organizationId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.getTasks().subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should apply filters as query params', () => {
      const filters = {
        status: 'TODO',
        category: 'Work',
      };

      service.getTasks(filters).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === 'http://localhost:3000/api/tasks' &&
          request.params.get('status') === 'TODO' &&
          request.params.get('category') === 'Work',
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const newTask = {
        title: 'New Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        category: 'Work',
      };

      service.createTask(newTask).subscribe((task) => {
        expect(task.id).toBeDefined();
        expect(task.title).toBe('New Task');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush({ id: 1, ...newTask, userId: 1, organizationId: 1 });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const updates = { title: 'Updated Task' };

      service.updateTask(1, updates).subscribe((task) => {
        expect(task.title).toBe('Updated Task');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush({ id: 1, ...updates });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      service.deleteTask(1).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
