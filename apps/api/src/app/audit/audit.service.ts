import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { IAuditLog, AuditAction } from '@app/data';

interface CreateAuditLogDto {
  userId: number;
  action: AuditAction;
  resource: string;
  resourceId?: number;
  details?: any;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogsRepository.create({
      ...data,
      details: JSON.stringify(data.details || {}),
    });

    return this.auditLogsRepository.save(log);
  }

  async findAll(userId?: number, filters?: any): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (userId) {
      queryBuilder.where('log.userId = :userId', { userId });
    }

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('log.timestamp >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('log.timestamp <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy('log.timestamp', 'DESC').limit(1000);

    return queryBuilder.getMany();
  }
}
