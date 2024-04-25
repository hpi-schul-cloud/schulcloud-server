import { SchulconnexClientModule } from '@infra/schulconnex-client';
import { AccountModule } from '@modules/account';
import { GroupModule } from '@modules/group';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system/system.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { UserLicenseModule } from '../user-license';
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
	SchulconnexLicenseProvisioningService,
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
		forwardRef(() => SchulconnexClientModule),
		UserLicenseModule,
	],
	providers: [
		ProvisioningService,
		SanisResponseMapper,
		SchulconnexSchoolProvisioningService,
		SchulconnexUserProvisioningService,
		SchulconnexGroupProvisioningService,
		SchulconnexCourseSyncService,
		SchulconnexLicenseProvisioningService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
