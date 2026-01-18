import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './app/users/entities/user.entity';
import { Role } from './app/users/entities/role.entity';
import { Organization } from './app/organizations/entities/organization.entity';
import { Task } from './app/tasks/entities/task.entity';
import { AuditLog } from './app/audit/entities/audit-log.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './data/database.sqlite',
  entities: [User, Role, Organization, Task, AuditLog],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Starting database seeding...');

  await AppDataSource.initialize();

  const roleRepository = AppDataSource.getRepository(Role);
  const orgRepository = AppDataSource.getRepository(Organization);
  const userRepository = AppDataSource.getRepository(User);
  const taskRepository = AppDataSource.getRepository(Task);

  // Create Roles
  console.log('Creating roles...');
  const ownerRole = await roleRepository.save({
    name: 'Owner',
    description: 'Full access to all resources',
    level: 3,
    permissions: [
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'audit:read',
    ],
  });

  const adminRole = await roleRepository.save({
    name: 'Admin',
    description: 'Can manage tasks and users within organization',
    level: 2,
    permissions: [
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
      'user:read',
      'audit:read',
    ],
  });

  const viewerRole = await roleRepository.save({
    name: 'Viewer',
    description: 'Read-only access to tasks',
    level: 1,
    permissions: ['task:read'],
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
