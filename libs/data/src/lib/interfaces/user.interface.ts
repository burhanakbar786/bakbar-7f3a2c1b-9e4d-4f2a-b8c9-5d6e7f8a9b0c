import { IRole } from './role.interface';
import { IOrganization } from './organization.interface';

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  organizationId: number;
  roleId: number;
  role?: IRole;
  organization?: IOrganization;
  createdAt: Date;
  updatedAt: Date;
}
