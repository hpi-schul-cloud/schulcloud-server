import { ConfigurationModule } from '@infra/configuration';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { BoardImportEvents } from './amqp';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from './board-import-exchange.config';

// Every app that publishes or consumes import jobs declares the queue,
// so that a job is not lost when it is published before the first consumer starts.
const rabbitMQModule = RabbitMQWrapperModule.register({
	exchangeConfigInjectionToken: BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN,
	exchangeConfigConstructor: BoardImportExchangeConfig,
	configInjectionToken: RABBITMQ_CONFIG_TOKEN,
	configConstructor: RabbitMQConfig,
	connectionName: 'board-import',
	queues: [{ name: BoardImportEvents.IMPORT_JOB, routingKey: BoardImportEvents.IMPORT_JOB }],
});

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig),
		rabbitMQModule,
	],
	exports: [rabbitMQModule],
})
export class BoardImportAmqpModule {}
