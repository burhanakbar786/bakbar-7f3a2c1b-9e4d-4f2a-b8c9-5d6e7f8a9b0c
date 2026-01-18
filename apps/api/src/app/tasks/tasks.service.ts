import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateTaskDto, UpdateTaskDto, RoleName } from '@turbovets/data';
import { getAccessibleOrgIds } from '@turbovets/auth';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@turbovets/data';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    // Check if user has permission to create tasks
    if (user.role.name === RoleName.VIEWER) {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId: user.userId,
      organizationId: user.organizationId,
    });

    const savedTask = await this.tasksRepository.save(task);

    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.CREATE_TASK,
      resource: 'tasks',
      resourceId: savedTask.id,
      details: { title: savedTask.title },
    });

    return savedTask;
  }

  async findAll(user: any, filters?: any): Promise<Task[]> {
    const allOrganizations = await this.organizationsRepository.find();
    const accessibleOrgIds = getAccessibleOrgIds(
      user.organizationId,
      user.role.name,
      allOrganizations,
    );

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds });

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.category) {
      queryBuilder.andWhere('task.category = :category', { category: filters.category });
    }
    if (filters?.priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority: filters.priority });
    }

    queryBuilder.orderBy('task.sortOrder', 'ASC').addOrderBy('task.createdAt', 'DESC');

    const tasks = await queryBuilder.getMany();

    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.VIEW_TASKS,
      resource: 'tasks',
      details: { count: tasks.length, filters },
    });

    return tasks;
  }

  async findOne(id: number, user: any): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    const allOrganizations = await this.organizationsRepository.find();
    const accessibleOrgIds = getAccessibleOrgIds(
      user.organizationId,
      user.role.name,
      allOrganizations,
    );

    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.VIEW_TASK,
      resource: 'tasks',
      resourceId: task.id,
    });

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check if user can modify this task
    const canModify =
      user.role.name === RoleName.OWNER ||
      user.role.name === RoleName.ADMIN ||
      task.userId === user.userId;

    if (!canModify) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);

    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.UPDATE_TASK,
      resource: 'tasks',
      resourceId: task.id,
      details: { changes: updateTaskDto },
    });

    return updatedTask;
  }

  async remove(id: number, user: any): Promise<void> {
    const task = await this.findOne(id, user);

    // Check if user can delete this task
    const canDelete =
      user.role.name === RoleName.OWNER ||
      user.role.name === RoleName.ADMIN ||
      task.userId === user.userId;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.remove(task);

    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.DELETE_TASK,
      resource: 'tasks',
      resourceId: id,
      details: { title: task.title },
    });
  }
}
