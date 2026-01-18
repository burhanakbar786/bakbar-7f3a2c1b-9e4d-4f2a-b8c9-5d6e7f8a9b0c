import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PermissionType {
  CREATE_TASK = 'create_task',
  READ_TASK = 'read_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  VIEW_AUDIT_LOG = 'view_audit_log',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: PermissionType;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
