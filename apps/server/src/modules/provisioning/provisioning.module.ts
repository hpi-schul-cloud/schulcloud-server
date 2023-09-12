import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account/account.module';
import { RoleModule } from '@src/modules/role';
import { SchoolModule } from '@src/modules/school/school.module';
import { SystemModule } from '@src/modules/system/system.module';
import { UserModule } from '@src/modules/user';
import { FederalStateRepo } from '../federal-state/repo';
import { FederalStateService } from '../federal-state/service/federal-state.service';
import { GroupModule } from '@src/modules/group';
import { ProvisioningService } from './service/provisioning.service';
import { IservProvisioningStrategy, OidcMockProvisioningStrategy, SanisProvisioningStrategy } from './strategy';
import { OidcProvisioningService } from './strategy/oidc/service/oidc-provisioning.service';
import { SanisResponseMapper } from './strategy/sanis/sanis-response.mapper';

@Module({
	imports: [AccountModule, SchoolModule, UserModule, RoleModule, SystemModule, HttpModule, LoggerModule, GroupModule],
	providers: [
		ProvisioningService,
		SanisResponseMapper,
		OidcProvisioningService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
		FederalStateService,
		FederalStateRepo,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
