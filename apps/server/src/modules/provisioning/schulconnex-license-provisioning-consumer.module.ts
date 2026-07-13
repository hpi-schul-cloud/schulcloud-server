import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
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
		RabbitMQWrapperModule.register({
			exchangeConfigInjectionToken: PROVISIONING_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: ProvisioningExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
			connectionName: 'schulconnex-license-provisioning',
		}),
	],
	providers: [
		SchulconnexLicenseProvisioningConsumer,
		SchulconnexLicenseProvisioningService,
		SchulconnexToolProvisioningService,
	],
})
export class SchulconnexLicenseProvisioningConsumerModule {}
