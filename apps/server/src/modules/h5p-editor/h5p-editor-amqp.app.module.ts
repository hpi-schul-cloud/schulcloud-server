import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig } from '@infra/h5p-editor-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { HealthApiModule } from '@modules/health';
import { Module } from '@nestjs/common';
import { H5pEditorConsumer } from './controller';
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
		ConfigurationModule.register(H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig),
		HealthApiModule,
		LoggerModule,
	],
	providers: [H5pEditorConsumer],
})
export class H5PEditorAMQPModule {}
