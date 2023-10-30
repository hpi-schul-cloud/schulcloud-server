import { Module } from '@nestjs/common';
import { RoleRepo } from '@shared/repo/role/role.repo';
import { RoleService } from './service/role.service';
import { RoleUc } from './uc/role.uc';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
