import { Module } from '@nestjs/common';
import { RoleRepo } from '@shared/repo';
import { RoleService } from '@modules/role/service/role.service';
import { RoleUc } from '@modules/role/uc/role.uc';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
