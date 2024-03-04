import { AccountModule } from '@modules/account/account.module';
import { GroupModule } from '@modules/group';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system/system.module';
import { UserModule } from '@modules/user/user.module';
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
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './strategy/oidc/service';

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
		LearnroomModule,
	],
	providers: [
		ProvisioningService,
		SanisResponseMapper,
		SchulconnexSchoolProvisioningService,
		SchulconnexUserProvisioningService,
		SchulconnexGroupProvisioningService,
		SchulconnexCourseSyncService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
