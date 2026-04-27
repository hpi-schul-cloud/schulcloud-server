import { Module } from '@nestjs/common';
import { SYSTEM_REPO, SystemService } from './domain';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';

@Module({
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
