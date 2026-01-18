import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './app/users/entities/user.entity';
import { Role, RoleType } from './app/users/entities/role.entity';
import { Permission, PermissionType } from './app/users/entities/permission.entity';
import { Organization } from './app/organizations/entities/organization.entity';
import { Task } from './app/tasks/entities/task.entity';
import { AuditLog } from './app/audit/entities/audit-log.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './data/database.sqlite',
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

  // Create Permissions
  console.log('Creating permissions...');
  const createTaskPerm = await permissionRepository.save({ 
    name: PermissionType.CREATE_TASK,
    description: 'Permission to create tasks'
  });
  const readTaskPerm = await permissionRepository.save({ 
    name: PermissionType.READ_TASK,
    description: 'Permission to read/view tasks'
  });
  const updateTaskPerm = await permissionRepository.save({ 
    name: PermissionType.UPDATE_TASK,
    description: 'Permission to update tasks'
  });
  const deleteTaskPerm = await permissionRepository.save({ 
    name: PermissionType.DELETE_TASK,
    description: 'Permission to delete tasks'
  });
  const viewAuditPerm = await permissionRepository.save({ 
    name: PermissionType.VIEW_AUDIT_LOG,
    description: 'Permission to view audit logs'
  });

  // Create Roles
  console.log('Creating roles...');
  const ownerRole = await roleRepository.save({
    name: RoleType.OWNER,
    description: 'Full access to all resources',
    level: 3,
    permissions: [createTaskPerm, readTaskPerm, updateTaskPerm, deleteTaskPerm, viewAuditPerm],
  });

  const adminRole = await roleRepository.save({
    name: RoleType.ADMIN,
    description: 'Can manage tasks within organization',
    level: 2,
    permissions: [createTaskPerm, readTaskPerm, updateTaskPerm, deleteTaskPerm],
  });

  const viewerRole = await roleRepository.save({
    name: RoleType.VIEWER,
    description: 'Read-only access to tasks',
    level: 1,
    permissions: [readTaskPerm],
  });

  // Create Organizations
  console.log('Creating organizations...');
  const parentOrg = await orgRepository.save({
    name: 'TurboVets HQ',
  });

  const childOrg = await orgRepository.save({
    name: 'Engineering Department',
    parentOrgId: parentOrg.id,
  });

  // Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const ownerUser = await userRepository.save({
    email: 'owner@turbovets.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Owner',
    organizationId: parentOrg.id,
    roleId: ownerRole.id,
  });

  const adminUser = await userRepository.save({
    email: 'admin@turbovets.com',
    password: hashedPassword,
    firstName: 'Jane',
    lastName: 'Admin',
    organizationId: childOrg.id,
    roleId: adminRole.id,
  });

  const viewerUser = await userRepository.save({
    email: 'viewer@turbovets.com',
    password: hashedPassword,
    firstName: 'Bob',
    lastName: 'Viewer',
    organizationId: childOrg.id,
    roleId: viewerRole.id,
  });

  // Create Sample Tasks
  console.log('Creating sample tasks...');
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
