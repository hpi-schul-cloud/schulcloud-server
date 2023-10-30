import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from '../account/account.module';
import { GroupModule } from '../group/group.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { RoleModule } from '../role/role.module';
import { SystemModule } from '../system/system.module';
import { UserModule } from '../user/user.module';
import { ProvisioningService } from './service/provisioning.service';
import { IservProvisioningStrategy } from './strategy/iserv/iserv.strategy';
import { OidcMockProvisioningStrategy } from './strategy/oidc-mock/oidc-mock.strategy';
import { OidcProvisioningService } from './strategy/oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './strategy/sanis/sanis-response.mapper';
import { SanisProvisioningStrategy } from './strategy/sanis/sanis.strategy';

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
