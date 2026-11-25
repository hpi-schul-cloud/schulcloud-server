import { ConfigurationModule } from '@infra/configuration';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { BoardImportEvents, BoardImportJobProducer } from './amqp';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from './board-import-exchange.config';
import { BOARD_IMPORT_RABBITMQ_CONFIG_TOKEN, BoardImportRabbitMQConfig } from './board-import-rabbitmq.config';

// Every app that publishes or consumes import jobs declares the queue,
// so that a job is not lost when it is published before the first consumer starts.
const rabbitMQModule = RabbitMQWrapperModule.register({
	exchangeConfigInjectionToken: BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN,
	exchangeConfigConstructor: BoardImportExchangeConfig,
	configInjectionToken: BOARD_IMPORT_RABBITMQ_CONFIG_TOKEN,
	configConstructor: BoardImportRabbitMQConfig,
	connectionName: 'board-import',
	queues: [{ name: BoardImportEvents.IMPORT_JOB, routingKey: BoardImportEvents.IMPORT_JOB }],
});

const exchangeConfigModule = ConfigurationModule.register(
	BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN,
	BoardImportExchangeConfig
);

@Module({
	imports: [exchangeConfigModule, rabbitMQModule],
	providers: [BoardImportJobProducer],
	exports: [exchangeConfigModule, rabbitMQModule, BoardImportJobProducer],
})
export class BoardImportAmqpModule {}
