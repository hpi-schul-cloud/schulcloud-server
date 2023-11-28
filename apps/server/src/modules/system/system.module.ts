import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { LegacySystemRepo } from '@shared/repo';
import { SystemRepo } from './repo';
import { LegacySystemService, SystemService } from './service';
import { SystemOidcService } from './service/system-oidc.service';

@Module({
	imports: [IdentityManagementModule],
	providers: [LegacySystemRepo, LegacySystemService, SystemOidcService, SystemService, SystemRepo],
	exports: [LegacySystemService, SystemOidcService, SystemService],
})
export class SystemModule {}
