import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { AuditService } from '../audit/audit.service';
import { RoleName } from '@turbovets/data';
import { ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskRepository: any;
  let mockOrgRepository: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    mockOrgRepository = {
      find: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should deny task creation for Viewer role', async () => {
      const viewer = {
        userId: 3,
        role: { name: RoleName.VIEWER },
        organizationId: 1,
      };

      await expect(service.create({ title: 'Test' } as any, viewer)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow Owner to create tasks', async () => {
      const owner = {
        userId: 1,
        role: { name: RoleName.OWNER },
        organizationId: 1,
      };

      const task = { id: 1, title: 'Test Task' };
      mockTaskRepository.create.mockReturnValue(task);
      mockTaskRepository.save.mockResolvedValue(task);

      const result = await service.create({ title: 'Test Task' } as any, owner);

      expect(result).toEqual(task);
      expect(mockTaskRepository.create).toHaveBeenCalled();
    });

    it('should allow Admin to create tasks', async () => {
      const admin = {
        userId: 2,
        role: { name: RoleName.ADMIN },
        organizationId: 1,
      };

      const task = { id: 1, title: 'Test Task' };
      mockTaskRepository.create.mockReturnValue(task);
      mockTaskRepository.save.mockResolvedValue(task);

      const result = await service.create({ title: 'Test Task' } as any, admin);

      expect(result).toEqual(task);
    });
  });

  describe('findAll', () => {
    it('should return tasks scoped to user organization', async () => {
      const user = {
        userId: 1,
        role: { name: RoleName.VIEWER },
        organizationId: 1,
      };

      const tasks = [{ id: 1, organizationId: 1 }];
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);

      const queryBuilder = mockTaskRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(user);

      expect(mockAuditService.log).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });

    it('should allow Owner to see child org tasks', async () => {
      const owner = {
        userId: 1,
        role: { name: RoleName.OWNER },
        organizationId: 1,
      };

      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 }, // Child of org 1
      ];

      mockOrgRepository.find.mockResolvedValue(organizations);

      const tasks = [
        { id: 1, organizationId: 1 },
        { id: 2, organizationId: 2 },
      ];

      const queryBuilder = mockTaskRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(owner);

      expect(result).toEqual(tasks);
    });
  });

  describe('update', () => {
    it('should deny update if user is Viewer', async () => {
      const viewer = {
        userId: 3,
        role: { name: RoleName.VIEWER },
        organizationId: 1,
      };

      const task = {
        id: 1,
        userId: 2,
        organizationId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.update(1, { title: 'Updated' } as any, viewer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Owner to update any task', async () => {
      const owner = {
        userId: 1,
        role: { name: RoleName.OWNER },
        organizationId: 1,
      };

      const task = {
        id: 1,
        userId: 2, // Different user
        organizationId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);
      mockTaskRepository.save.mockResolvedValue({ ...task, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' } as any, owner);

      expect(result.title).toBe('Updated');
    });

    it('should allow user to update their own task', async () => {
      const user = {
        userId: 2,
        role: { name: RoleName.VIEWER },
        organizationId: 1,
      };

      const task = {
        id: 1,
        userId: 2, // Same user
        organizationId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);
      mockTaskRepository.save.mockResolvedValue({ ...task, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' } as any, user);

      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should deny delete if user is Viewer and not task owner', async () => {
      const viewer = {
        userId: 3,
        role: { name: RoleName.VIEWER },
        organizationId: 1,
      };

      const task = {
        id: 1,
        userId: 2,
        organizationId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.remove(1, viewer)).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to delete tasks in their org', async () => {
      const admin = {
        userId: 2,
        role: { name: RoleName.ADMIN },
        organizationId: 1,
      };

      const task = {
        id: 1,
        userId: 3,
        organizationId: 1,
      };

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockOrgRepository.find.mockResolvedValue([{ id: 1 }]);
      mockTaskRepository.remove.mockResolvedValue(task);

      await service.remove(1, admin);

      expect(mockTaskRepository.remove).toHaveBeenCalledWith(task);
    });
  });
});
