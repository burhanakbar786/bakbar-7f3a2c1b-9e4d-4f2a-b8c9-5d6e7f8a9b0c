import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './app/users/entities/user.entity';
import { Role, RoleType } from './app/users/entities/role.entity';
import { Permission, PermissionType } from './app/users/entities/permission.entity';
import { Organization } from './app/organizations/entities/organization.entity';
import { Task } from './app/tasks/entities/task.entity';
import { AuditLog } from './app/audit/entities/audit-log.entity';

import * as path from 'path';
import * as dotenv from 'dotenv';

const envFilePath = path.resolve(process.cwd(), 'apps/api/.env');
dotenv.config({ path: envFilePath });

const resolvedDatabasePath = process.env.DATABASE_PATH
  ? path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'apps/api/data/database.sqlite');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: resolvedDatabasePath,
  entities: [User, Role, Permission, Organization, Task, AuditLog],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Starting database seeding...');

  await AppDataSource.initialize();

  const permissionRepository = AppDataSource.getRepository(Permission);
  const roleRepository = AppDataSource.getRepository(Role);
  const orgRepository = AppDataSource.getRepository(Organization);
  const userRepository = AppDataSource.getRepository(User);
  const taskRepository = AppDataSource.getRepository(Task);

  const getOrCreatePermission = async (name: PermissionType, description: string) => {
    const existing = await permissionRepository.findOne({ where: { name } });
    if (existing) {
      return existing;
    }
    return permissionRepository.save({ name, description });
  };

  const upsertRole = async (
    name: RoleType,
    description: string,
    level: number,
    permissions: Permission[],
  ) => {
    const existing = await roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    if (existing) {
      existing.description = description;
      existing.level = level;
      existing.permissions = permissions;
      return roleRepository.save(existing);
    }

    return roleRepository.save({ name, description, level, permissions });
  };

  const getOrCreateOrg = async (name: string, parentOrgId?: number) => {
    const existing = await orgRepository.findOne({ where: { name } });
    if (existing) {
      if (parentOrgId !== undefined) {
        existing.parentOrgId = parentOrgId;
        return orgRepository.save(existing);
      }
      return existing;
    }

    return orgRepository.save({ name, parentOrgId });
  };

  const upsertUser = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationId: number,
    roleId: string,
  ) => {
    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      existing.password = password;
      existing.firstName = firstName;
      existing.lastName = lastName;
      existing.organizationId = organizationId;
      existing.roleId = roleId;
      return userRepository.save(existing);
    }

    return userRepository.save({
      email,
      password,
      firstName,
      lastName,
      organizationId,
      roleId,
    });
  };

  // Create Permissions
  console.log('Creating permissions...');
  const createTaskPerm = await getOrCreatePermission(
    PermissionType.CREATE_TASK,
    'Permission to create tasks',
  );
  const readTaskPerm = await getOrCreatePermission(
    PermissionType.READ_TASK,
    'Permission to read/view tasks',
  );
  const updateTaskPerm = await getOrCreatePermission(
    PermissionType.UPDATE_TASK,
    'Permission to update tasks',
  );
  const deleteTaskPerm = await getOrCreatePermission(
    PermissionType.DELETE_TASK,
    'Permission to delete tasks',
  );
  const viewAuditPerm = await getOrCreatePermission(
    PermissionType.VIEW_AUDIT_LOG,
    'Permission to view audit logs',
  );

  // Create Roles
  console.log('Creating roles...');
  const ownerRole = await upsertRole(
    RoleType.OWNER,
    'Full access to all resources',
    3,
    [createTaskPerm, readTaskPerm, updateTaskPerm, deleteTaskPerm, viewAuditPerm],
  );

  const adminRole = await upsertRole(
    RoleType.ADMIN,
    'Can manage tasks within organization',
    2,
    [createTaskPerm, readTaskPerm, updateTaskPerm, deleteTaskPerm],
  );

  const viewerRole = await upsertRole(
    RoleType.VIEWER,
    'Read-only access to tasks',
    1,
    [readTaskPerm],
  );

  // Create Organizations
  console.log('Creating organizations...');
  const parentOrg = await getOrCreateOrg('TurboVets HQ');

  const childOrg = await getOrCreateOrg('Engineering Department', parentOrg.id);

  // Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const ownerUser = await upsertUser(
    'owner@turbovets.com',
    hashedPassword,
    'John',
    'Owner',
    parentOrg.id,
    ownerRole.id,
  );

  const adminUser = await upsertUser(
    'admin@turbovets.com',
    hashedPassword,
    'Jane',
    'Admin',
    childOrg.id,
    adminRole.id,
  );

  const viewerUser = await upsertUser(
    'viewer@turbovets.com',
    hashedPassword,
    'Bob',
    'Viewer',
    childOrg.id,
    viewerRole.id,
  );

  // Create Sample Tasks
  console.log('Creating sample tasks...');
  const existingTaskCount = await taskRepository.count();
  if (existingTaskCount === 0) {
    await taskRepository.save([
      {
        title: 'Implement JWT Authentication',
        description: 'Add secure JWT-based authentication to all API endpoints',
        status: 'DONE',
        priority: 'HIGH',
        category: 'Work',
        userId: ownerUser.id,
        organizationId: parentOrg.id,
        sortOrder: 1,
      },
      {
        title: 'Build Task Dashboard UI',
        description: 'Create responsive Angular dashboard with TailwindCSS',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'Work',
        userId: adminUser.id,
        organizationId: childOrg.id,
        sortOrder: 2,
      },
      {
        title: 'Write API Documentation',
        description: 'Document all endpoints with examples',
        status: 'TODO',
        priority: 'MEDIUM',
        category: 'Work',
        userId: adminUser.id,
        organizationId: childOrg.id,
        sortOrder: 3,
      },
      {
        title: 'Review Team Code',
        description: 'Code review for pull requests',
        status: 'TODO',
        priority: 'MEDIUM',
        category: 'Work',
        userId: ownerUser.id,
        organizationId: parentOrg.id,
        sortOrder: 4,
      },
      {
        title: 'Prepare for Demo',
        description: 'Get ready for TurboVets demo presentation',
        status: 'TODO',
        priority: 'HIGH',
        category: 'Personal',
        userId: viewerUser.id,
        organizationId: childOrg.id,
        sortOrder: 5,
      },
    ]);
  }

  console.log('✅ Database seeding completed!');
  console.log('\n📧 Sample User Credentials:');
  console.log('Owner: owner@turbovets.com / Password123!');
  console.log('Admin: admin@turbovets.com / Password123!');
  console.log('Viewer: viewer@turbovets.com / Password123!');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
