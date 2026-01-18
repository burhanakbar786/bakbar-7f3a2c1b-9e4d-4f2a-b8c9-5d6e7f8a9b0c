import { Module } from '@nestjs/common';
import * as path from 'path';
import { AppController } from './app.controller';
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

const envFilePath = path.resolve(process.cwd(), 'apps/api/.env');

// Always resolve database path relative to apps/api, not cwd
const databasePath = process.env.DATABASE_PATH
  ? path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.resolve(process.cwd(), 'apps/api', process.env.DATABASE_PATH.replace('./', ''))
  : path.resolve(process.cwd(), 'apps/api/data/database.sqlite');

console.log('🔍 [DEBUG] process.cwd():', process.cwd());
console.log('🔍 [DEBUG] Database path resolved to:', databasePath);
console.log('🔍 [DEBUG] Env file path:', envFilePath);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: databasePath,
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
  controllers: [AppController],
})
export class AppModule {}
