import { Module } from '@nestjs/common';
import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { SystemRepo } from '@shared/repo';
import { SystemService } from '@modules/system/service/system.service';
import { SystemOidcService } from './service/system-oidc.service';

@Module({
	imports: [IdentityManagementModule],
	providers: [SystemRepo, SystemService, SystemOidcService],
	exports: [SystemService, SystemOidcService],
})
export class SystemModule {}
