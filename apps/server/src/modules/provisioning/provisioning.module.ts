import { AccountModule } from '@modules/account';
import { GroupModule } from '@modules/group';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system/system.module';
import { ExternalToolModule } from '@modules/tool';
import { SchoolExternalToolModule } from '@modules/tool/school-external-tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SchulconnexClientModule } from '@src/infra/schulconnex-client';
import { ClassModule } from '../class';
import { UserLicenseModule } from '../user-license';
import { ProvisioningService } from './service/provisioning.service';
import { TspProvisioningService } from './service/tsp-provisioning.service';
import {
	IservProvisioningStrategy,
	OidcMockProvisioningStrategy,
	SanisProvisioningStrategy,
	SchulconnexResponseMapper,
} from './strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './strategy/oidc/service';
import { TspProvisioningStrategy } from './strategy/tsp/tsp.strategy';

@Module({
	imports: [
		AccountModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		LoggerModule,
		GroupModule,
		LearnroomModule,
		SchulconnexClientModule.registerAsync(),
		UserLicenseModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		SchoolModule,
		ClassModule,
	],
	providers: [
		ProvisioningService,
		SchulconnexResponseMapper,
		SchulconnexSchoolProvisioningService,
		SchulconnexUserProvisioningService,
		SchulconnexGroupProvisioningService,
		SchulconnexCourseSyncService,
		SchulconnexLicenseProvisioningService,
		SchulconnexToolProvisioningService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
		TspProvisioningStrategy,
		TspProvisioningService,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
