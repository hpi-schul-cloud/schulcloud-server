import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { LegacySchoolModule } from '../legacy-school';
import { MediaSourceModule } from '../media-source/media-source.module';
import { ToolModule } from '../tool';
import { UserLicenseModule } from '../user-license';
import { SchulconnexLicenseProvisioningConsumer } from './amqp';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from './strategy/schulconnex/service';

@Module({
	imports: [LoggerModule, UserLicenseModule, MediaSourceModule, ToolModule, LegacySchoolModule],
	providers: [
		SchulconnexLicenseProvisioningConsumer,
		SchulconnexLicenseProvisioningService,
		SchulconnexToolProvisioningService,
	],
})
export class SchulconnexLicenseProvisioningConsumerModule {}
