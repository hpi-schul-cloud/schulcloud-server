import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { LegacySystemRepo } from '@shared/repo';
import { SYSTEM_REPO } from './domain';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';
import { LegacySystemService, SystemService } from './service';
import { SystemOidcService } from './service/system-oidc.service';

@Module({
	imports: [IdentityManagementModule],
	providers: [
		LegacySystemRepo,
		LegacySystemService,
		SystemOidcService,
		SystemService,
		{ provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo },
	],
	exports: [LegacySystemService, SystemOidcService, SystemService],
})
export class SystemModule {}
