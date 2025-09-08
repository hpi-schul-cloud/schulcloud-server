import { Module } from '@nestjs/common';
import { RoleRepo } from './repo';
import { RoleService } from './service';

@Module({
	providers: [RoleRepo, RoleService],
	exports: [RoleService, RoleRepo],
})
export class RoleModule {}
