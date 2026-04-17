import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from '@infra/schulconnex-client';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountModule } from '@modules/account';
import { ClassModule } from '@modules/class';
import { CourseModule } from '@modules/course';
import { CourseSynchronizationHistoryModule } from '@modules/course-synchronization-history';
import { ErwinIdentifierModule } from '@modules/erwin-identifier';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license';
import { SystemModule } from '@modules/system/system.module';
import { TeamModule } from '@modules/team';
import { ExternalToolModule } from '@modules/tool';
import { SchoolExternalToolModule } from '@modules/tool/school-external-tool';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { MediumMetadataModule } from '../medium-metadata';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from './amqp';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig } from './provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from './provisioning.config';
import { ErwinProvisioningService } from './service/erwin-provisioning.service';
import { ProvisioningService } from './service/provisioning.service';
import { TspProvisioningService } from './service/tsp-provisioning.service';
import {
	OidcMockProvisioningStrategy,
	SchulconnexAsyncProvisioningStrategy,
	SchulconnexResponseMapper,
	TspProvisioningStrategy,
} from './strategy';
import { ErwinProvisioningStrategy } from './strategy/erwin';
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
		ErwinIdentifierModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		LoggerModule,
		GroupModule,
		TeamModule,
		CourseModule,
		SchulconnexClientModule.register(SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig),
		UserLicenseModule,
		ConfigurationModule.register(PROVISIONING_CONFIG_TOKEN, ProvisioningConfig),
		ConfigurationModule.register(PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig),
		SchoolLicenseModule,
		MediaSourceModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		SchoolModule,
		ClassModule,
		CourseSynchronizationHistoryModule,
		MediumMetadataModule,
		MediaSourceSyncModule,
		RabbitMQWrapperModule.register({
			exchangeConfigInjectionToken: PROVISIONING_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: ProvisioningExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
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
		SchulconnexAsyncProvisioningStrategy,
		OidcMockProvisioningStrategy,
		TspProvisioningStrategy,
		TspProvisioningService,
		ErwinProvisioningStrategy,
		ErwinProvisioningService,
		SchulconnexGroupProvisioningProducer,
		SchulconnexLicenseProvisioningProducer,
	],
	exports: [ProvisioningService, TspProvisioningService],
})
export class ProvisioningModule {}
