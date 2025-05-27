import { LoggerModule } from '@core/logger';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { SchoolLicenseModule } from '@modules/school-license';
import { ToolModule } from '@modules/tool/tool.module';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { SchulconnexLicenseProvisioningConsumer } from './amqp';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from './strategy/schulconnex/service';

@Module({
	imports: [
		LoggerModule,
		UserLicenseModule,
		SchoolLicenseModule,
		MediaSourceModule,
		LegacySchoolModule,
		ToolModule,
		MediaSourceSyncModule,
	],
	providers: [
		SchulconnexLicenseProvisioningConsumer,
		SchulconnexLicenseProvisioningService,
		SchulconnexToolProvisioningService,
	],
})
export class SchulconnexLicenseProvisioningConsumerModule {}
