import { Module } from '@nestjs/common';
import { RoleRepo } from '@shared/repo/role';
import { RoleService } from './service';
import { RoleUc } from './uc';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
