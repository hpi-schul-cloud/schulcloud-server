import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { IdentityManagementModule } from '@shared/infra/identity-management/identity-management.module';
import { SystemRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SystemService } from '@src/modules/system/service/system.service';
import { LdapSyncConsole } from './console/ldap-sync.console';
import { SystemOidcService } from './service/system-oidc.service';

@Module({
	imports: [IdentityManagementModule, LoggerModule],
	providers: [SystemRepo, SystemService, SystemOidcService, LdapSyncConsole, FeathersServiceProvider],
	exports: [SystemService, SystemOidcService],
})
export class SystemModule {}
