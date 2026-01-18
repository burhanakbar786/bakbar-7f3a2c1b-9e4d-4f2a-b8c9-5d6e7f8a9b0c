import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async findAll(): Promise<Organization[]> {
    return this.organizationsRepository.find({
      relations: ['parentOrg', 'childOrgs'],
    });
  }

  async findOne(id: number): Promise<Organization> {
    return this.organizationsRepository.findOne({
      where: { id },
      relations: ['parentOrg', 'childOrgs'],
    });
  }
}
