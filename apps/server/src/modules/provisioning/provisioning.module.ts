import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account/account.module';
import { RoleModule } from '@src/modules/role';
import { SchoolMigrationModule } from '@src/modules/school-migration/school.module';
import { SystemModule } from '@src/modules/system/system.module';
import { UserModule } from '@src/modules/user';
import { ProvisioningService } from './service/provisioning.service';
import { IservProvisioningStrategy, OidcMockProvisioningStrategy, SanisProvisioningStrategy } from './strategy';
import { OidcProvisioningService } from './strategy/oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './strategy/sanis/sanis-response.mapper';

@Module({
	imports: [AccountModule, SchoolMigrationModule, UserModule, RoleModule, SystemModule, HttpModule, LoggerModule],
	providers: [
		ProvisioningService,
		SanisResponseMapper,
		OidcProvisioningService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
