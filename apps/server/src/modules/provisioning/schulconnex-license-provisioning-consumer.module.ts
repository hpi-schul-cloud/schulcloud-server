import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { MediumMetadataModule } from '@modules/medium-metadata';
import { SchoolLicenseModule } from '@modules/school-license';
import { ToolModule } from '@modules/tool/tool.module';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { SchulconnexLicenseProvisioningConsumer } from './amqp';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig } from './provisioning-exchange.config';
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
		MediumMetadataModule,
		MediaSourceSyncModule,
		ConfigurationModule.register(PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig),
	],
	providers: [
		SchulconnexLicenseProvisioningConsumer,
		SchulconnexLicenseProvisioningService,
		SchulconnexToolProvisioningService,
	],
})
export class SchulconnexLicenseProvisioningConsumerModule {}
