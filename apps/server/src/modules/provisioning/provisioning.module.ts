import { Module } from '@nestjs/common';
import { GroupModule } from '../group';
import { LearnroomModule } from '../learnroom';
import { LegacySchoolModule } from '../legacy-school';
import { RoleModule } from '../role';
import { SchoolModule } from '../school';
import { SystemModule } from '../system/system.module';
import { ExternalToolModule } from '../tool';
import { SchoolExternalToolModule } from '../tool/school-external-tool';
import { UserModule } from '../user';
import { LoggerModule } from '../../core/logger';
import { SchulconnexClientModule } from '../../infra/schulconnex-client';
import { AccountModule } from '../account';
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
