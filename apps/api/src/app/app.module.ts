import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditModule } from './audit/audit.module';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { Permission } from './users/entities/permission.entity';
import { Organization } from './organizations/entities/organization.entity';
import { Task } from './tasks/entities/task.entity';
import { AuditLog } from './audit/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'task-management.db',
      entities: [User, Role, Permission, Organization, Task, AuditLog],
      synchronize: true, // Set to false in production
      logging: false,
    }),
    AuthModule,
    TasksModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
  ],
})
export class AppModule {}
