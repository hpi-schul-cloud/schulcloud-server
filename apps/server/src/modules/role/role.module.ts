import { Module } from '@nestjs/common';
import { RoleRepo } from './repo';
import { RoleService } from './service';
import { RoleUc } from './uc';

@Module({
	providers: [RoleRepo, RoleService, RoleUc],
	exports: [RoleService, RoleUc, RoleRepo],
})
export class RoleModule {}
