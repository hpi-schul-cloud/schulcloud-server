import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@modules/account/account.module';
import { RoleModule } from '@modules/role';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SystemModule } from '@modules/system/system.module';
import { UserModule } from '@modules/user';
import { GroupModule } from '@modules/group';
import { ProvisioningService } from './service/provisioning.service';
import { IservProvisioningStrategy, OidcMockProvisioningStrategy, SanisProvisioningStrategy } from './strategy';
import { OidcProvisioningService } from './strategy/oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './strategy/sanis/sanis-response.mapper';

@Module({
	imports: [
		AccountModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		HttpModule,
		LoggerModule,
		GroupModule,
	],
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
