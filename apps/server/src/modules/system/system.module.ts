import { Module } from '@nestjs/common';
import { IdentityManagementModule } from '@shared/infra/identity-management/identity-management.module';
import { SystemRepo } from '@shared/repo/system/system.repo';
import { SystemOidcService } from './service/system-oidc.service';
import { SystemService } from './service/system.service';

@Module({
	imports: [IdentityManagementModule],
	providers: [SystemRepo, SystemService, SystemOidcService],
	exports: [SystemService, SystemOidcService],
})
export class SystemModule {}
