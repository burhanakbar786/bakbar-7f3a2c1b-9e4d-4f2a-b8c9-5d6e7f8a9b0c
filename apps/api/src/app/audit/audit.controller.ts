import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard, CurrentUser, Roles, RolesGuard } from '@app/auth';
import { RoleName } from '@app/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(RoleName.OWNER, RoleName.ADMIN)
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.auditService.findAll(query.userId, query);
  }
}
