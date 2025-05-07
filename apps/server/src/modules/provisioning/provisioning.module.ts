import { LoggerModule } from '@core/logger';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountModule } from '@modules/account';
import { ClassModule } from '@modules/class';
import { CourseModule } from '@modules/course';
import { CourseSynchronizationHistoryModule } from '@modules/course-synchronization-history';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license';
import { SystemModule } from '@modules/system/system.module';
import { ExternalToolModule } from '@modules/tool';
import { SchoolExternalToolModule } from '@modules/tool/school-external-tool';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from './amqp';
import { ProvisioningService } from './service/provisioning.service';
import { TspProvisioningService } from './service/tsp-provisioning.service';
import {
	OidcMockProvisioningStrategy,
	SchulconnexAsyncProvisioningStrategy,
	SchulconnexResponseMapper,
	SchulconnexSyncProvisioningStrategy,
	TspProvisioningStrategy,
} from './strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './strategy/schulconnex/service';

@Module({
	imports: [
		AccountModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		LoggerModule,
		GroupModule,
		CourseModule,
		SchulconnexClientModule.registerAsync(),
		UserLicenseModule,
		SchoolLicenseModule,
		MediaSourceModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		SchoolModule,
		ClassModule,
		CourseSynchronizationHistoryModule,
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
		SchulconnexSyncProvisioningStrategy,
		SchulconnexAsyncProvisioningStrategy,
		OidcMockProvisioningStrategy,
		TspProvisioningStrategy,
		TspProvisioningService,
		SchulconnexGroupProvisioningProducer,
		SchulconnexLicenseProvisioningProducer,
	],
	exports: [ProvisioningService, TspProvisioningService],
})
export class ProvisioningModule {}
