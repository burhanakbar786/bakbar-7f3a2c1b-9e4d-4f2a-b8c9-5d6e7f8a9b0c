export interface IAuditLog {
  id: number;
  userId: number;
  action: AuditAction;
  resource: string;
  resourceId?: number;
  details?: any;
  timestamp: Date;
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  VIEW_TASK = 'VIEW_TASK',
  VIEW_TASKS = 'VIEW_TASKS',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
}
