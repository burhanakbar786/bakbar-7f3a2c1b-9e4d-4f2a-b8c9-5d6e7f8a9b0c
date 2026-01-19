export interface IOrganization {
  id: number;
  name: string;
  parentOrgId?: number;
  parentOrg?: IOrganization;
  childOrgs?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}
