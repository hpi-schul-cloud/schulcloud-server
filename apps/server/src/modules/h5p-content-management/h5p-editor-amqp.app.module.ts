import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig } from '@infra/h5p-editor-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { H5pEditorConsumer } from './controller';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5PEditorModule } from './h5p-editor.module';

@Module({
	imports: [
		H5PEditorModule,
		RabbitMQWrapperModule.register({
			exchangeConfigInjectionToken: H5P_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: H5pExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		ConfigurationModule.register(H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig),
		HealthApiModule,
		LoggerModule,
	],
	providers: [H5pEditorConsumer],
})
export class H5PEditorAMQPModule {}
