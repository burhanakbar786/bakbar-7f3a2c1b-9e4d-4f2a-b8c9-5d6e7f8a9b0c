import {
  getAccessibleOrgIds,
  findChildOrganizations,
  getRoleLevel,
  hasRoleLevel,
} from './rbac.utils';
import { RoleName } from '@app/data';

describe('RBAC Utils', () => {
  describe('findChildOrganizations', () => {
    it('should find direct child organizations', () => {
      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 },
        { id: 3, parentOrgId: 1 },
      ];

      const result = findChildOrganizations(1, organizations as any);

      expect(result).toHaveLength(2);
      expect(result.map((o) => o.id)).toEqual([2, 3]);
    });

    it('should find nested child organizations', () => {
      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 },
        { id: 3, parentOrgId: 2 },
        { id: 4, parentOrgId: 3 },
      ];

      const result = findChildOrganizations(1, organizations as any);

      expect(result).toHaveLength(3);
      expect(result.map((o) => o.id)).toEqual(expect.arrayContaining([2, 3, 4]));
    });

    it('should return empty array if no children', () => {
      const organizations = [{ id: 1, parentOrgId: null }];

      const result = findChildOrganizations(1, organizations as any);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAccessibleOrgIds', () => {
    it('should return only own org for non-owner roles', () => {
      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 },
      ];

      const result = getAccessibleOrgIds(1, RoleName.ADMIN, organizations as any);

      expect(result).toEqual([1]);
    });

    it('should return own org and child orgs for Owner', () => {
      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 },
        { id: 3, parentOrgId: 1 },
      ];

      const result = getAccessibleOrgIds(1, RoleName.OWNER, organizations as any);

      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    it('should handle nested hierarchies for Owner', () => {
      const organizations = [
        { id: 1, parentOrgId: null },
        { id: 2, parentOrgId: 1 },
        { id: 3, parentOrgId: 2 },
      ];

      const result = getAccessibleOrgIds(1, RoleName.OWNER, organizations as any);

      expect(result).toEqual(expect.arrayContaining([1, 2, 3]));
    });
  });

  describe('getRoleLevel', () => {
    it('should return correct levels for roles', () => {
      expect(getRoleLevel(RoleName.VIEWER)).toBe(1);
      expect(getRoleLevel(RoleName.ADMIN)).toBe(2);
      expect(getRoleLevel(RoleName.OWNER)).toBe(3);
    });
  });

  describe('hasRoleLevel', () => {
    it('should return true if user role is higher or equal', () => {
      expect(hasRoleLevel(RoleName.OWNER, RoleName.ADMIN)).toBe(true);
      expect(hasRoleLevel(RoleName.ADMIN, RoleName.VIEWER)).toBe(true);
      expect(hasRoleLevel(RoleName.OWNER, RoleName.OWNER)).toBe(true);
    });

    it('should return false if user role is lower', () => {
      expect(hasRoleLevel(RoleName.VIEWER, RoleName.ADMIN)).toBe(false);
      expect(hasRoleLevel(RoleName.ADMIN, RoleName.OWNER)).toBe(false);
    });
  });
});
