import { Module } from '@nestjs/common';
import { RoleRepo } from '@shared/repo';
import { RoleService } from '@src/modules/role/service/role.service';
import { RoleUc } from '@src/modules/role/uc/role.uc';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
