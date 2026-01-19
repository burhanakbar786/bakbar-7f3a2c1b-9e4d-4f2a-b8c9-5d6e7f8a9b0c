import { IOrganization, RoleName } from '@turbovets/data';

/**
 * Get all organization IDs that a user has access to based on their role and organization
 */
/**
 * Determines which organization IDs a user can access based on their role.
 * 
 * RBAC Logic:
 * - Owners: Can access their org AND all child organizations (recursive)
 * - Admins/Viewers: Can only access their own organization
 * 
 * @param userOrgId - The user's primary organization ID
 * @param userRole - The user's role (Owner, Admin, or Viewer)
 * @param allOrganizations - Complete list of all organizations in the system
 * @returns Array of organization IDs the user can access
 * 
 * @example
 * // Owner of org 1 with children [2, 3]
 * getAccessibleOrgIds(1, RoleName.OWNER, orgs) // Returns [1, 2, 3]
 * 
 * // Admin of org 2
 * getAccessibleOrgIds(2, RoleName.ADMIN, orgs) // Returns [2]
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
/**
 * Recursively finds all child organizations under a parent organization.
 * 
 * This function traverses the organizational hierarchy tree depth-first,
 * collecting all descendants at any level.
 * 
 * @param parentId - The parent organization ID to search from
 * @param allOrganizations - Complete list of all organizations
 * @returns Array of all child organizations (direct and nested)
 * 
 * @example
 * // Hierarchy: Company (1) -> Engineering (2) -> Backend Team (3)
 * findChildOrganizations(1, orgs) // Returns [Engineering, Backend Team]
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
/**
 * Returns the hierarchical level of a role for comparison.
 * Higher numbers = more permissions.
 * 
 * Role Hierarchy:
 * - Owner: 3 (highest - full system access)
 * - Admin: 2 (moderate - can manage resources)
 * - Viewer: 1 (lowest - read-only access)
 * 
 * @param roleName - The role to get the level for
 * @returns Numeric level representing role power
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
