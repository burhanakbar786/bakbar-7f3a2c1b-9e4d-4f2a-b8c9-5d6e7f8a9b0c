export interface IRole {
  id: number;
  name: RoleName;
  description: string;
  level: number;
  permissions: string[];
}

export enum RoleName {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
}
