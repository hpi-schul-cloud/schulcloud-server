import { Module } from '@nestjs/common';
import { RoleService } from './service';
import { RoleUc } from './uc';
import { RoleRepo } from './repo';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
