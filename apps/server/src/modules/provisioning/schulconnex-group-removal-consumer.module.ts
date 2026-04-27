import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration/configuration.module';
import { CourseModule } from '@modules/course';
import { CourseSynchronizationHistoryModule } from '@modules/course-synchronization-history';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SchulconnexGroupRemovalConsumer } from './amqp';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig } from './provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from './provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from './strategy/schulconnex/service';
import { RabbitMQWrapperModule, RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';

@Module({
	imports: [
		LoggerModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		GroupModule,
		CourseModule,
		CourseSynchronizationHistoryModule,
		ConfigurationModule.register(PROVISIONING_CONFIG_TOKEN, ProvisioningConfig),
		ConfigurationModule.register(PROVISIONING_EXCHANGE_CONFIG_TOKEN, ProvisioningExchangeConfig),
		RabbitMQWrapperModule.register({
			exchangeConfigInjectionToken: PROVISIONING_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: ProvisioningExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [SchulconnexGroupRemovalConsumer, SchulconnexGroupProvisioningService, SchulconnexCourseSyncService],
})
export class SchulconnexGroupRemovalConsumerModule {}
