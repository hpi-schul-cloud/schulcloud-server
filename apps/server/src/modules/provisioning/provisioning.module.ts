import { AccountModule } from '@modules/account/account.module';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system/system.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ProvisioningConfigModule } from './provisioning-config.module';
import { ProvisioningService } from './service/provisioning.service';
import {
	IservProvisioningStrategy,
	OidcMockProvisioningStrategy,
	SanisProvisioningStrategy,
	SanisResponseMapper,
} from './strategy';
import { OidcProvisioningService } from './strategy/oidc/service/oidc-provisioning.service';

@Module({
	imports: [
		ProvisioningConfigModule,
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
