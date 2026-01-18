import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  parentOrgId: number;

  @ManyToOne(() => Organization, (org) => org.childOrgs, { nullable: true })
  @JoinColumn({ name: 'parentOrgId' })
  parentOrg: Organization;

  @OneToMany(() => Organization, (org) => org.parentOrg)
  childOrgs: Organization[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
