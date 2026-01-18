import { IOrganization, RoleName } from '@app/data';

/**
 * Get all organization IDs that a user has access to based on their role and organization
 */
export function getAccessibleOrgIds(
  userOrgId: number,
  userRole: RoleName,
  allOrganizations: IOrganization[],
): number[] {
  const accessibleIds = [userOrgId];

  // Owners can access child organizations
  if (userRole === RoleName.OWNER) {
    const childOrgs = findChildOrganizations(userOrgId, allOrganizations);
    accessibleIds.push(...childOrgs.map((org) => org.id));
  }

  return accessibleIds;
}

/**
 * Recursively find all child organizations
 */
export function findChildOrganizations(
  parentId: number,
  allOrganizations: IOrganization[],
): IOrganization[] {
  const children = allOrganizations.filter((org) => org.parentOrgId === parentId);
  const descendants: IOrganization[] = [...children];

  children.forEach((child) => {
    descendants.push(...findChildOrganizations(child.id, allOrganizations));
  });

  return descendants;
}

/**
 * Check if user can access a specific organization
 */
export function canAccessOrganization(
  userId: number,
  userOrgId: number,
  userRole: RoleName,
  targetOrgId: number,
  allOrganizations: IOrganization[],
): boolean {
  const accessibleOrgIds = getAccessibleOrgIds(userOrgId, userRole, allOrganizations);
  return accessibleOrgIds.includes(targetOrgId);
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  return userPermissions?.includes(requiredPermission) || false;
}

/**
 * Get role level for hierarchy comparison
 */
export function getRoleLevel(roleName: RoleName): number {
  const levels = {
    [RoleName.VIEWER]: 1,
    [RoleName.ADMIN]: 2,
    [RoleName.OWNER]: 3,
  };
  return levels[roleName] || 0;
}

/**
 * Check if user role is higher or equal to required role
 */
export function hasRoleLevel(userRole: RoleName, requiredRole: RoleName): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}
