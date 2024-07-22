import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { SYSTEM_REPO } from './domain';
import { SystemMikroOrmRepo } from './repo';
import { SystemService } from './service';

@Module({
	imports: [IdentityManagementModule],
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
