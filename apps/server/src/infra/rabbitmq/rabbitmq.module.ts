import { AmqpConnectionManager, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
	FilesStorageExchange,
	H5pEditorExchange,
	HeartBeatIntervalInSeconds,
	MailSendExchange,
	RabbitMqURI,
	SchulconnexProvisioningExchange,
} from './rabbitmq.config';
import { SchemaRegistryService } from './schema-registry.service';
import { SchemaValidatedProducerService } from './schema-validated-producer.service';
import { registerAllSchemas } from './schemas/schema-definitions';

/**
 * https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq#usage
 * we want to have the RabbitMQModule globally available, since it provides via a factory the AMQPConnection.
 * You shall not explicitly declare the AMQPConnection in your modules since it will create a new AMQPConnection which will not be initialized!
 *
 * Therefore, the combination of @Global() and export: [RabbitMQModule] is required.
 */

const imports = [
	RabbitMQModule.forRoot(RabbitMQModule, {
		// Please don't change the global prefetch count for the existing exchanges.
		// If you need individual prefetch counts for each consumer, please create a separate RabbitMQModule with channels for your deployment.
		prefetchCount: Configuration.get('RABBITMQ_GLOBAL_PREFETCH_COUNT') as number,
		exchanges: [
			{
				name: MailSendExchange,
				type: 'direct',
			},
			{
				name: FilesStorageExchange,
				type: 'direct',
			},
			{
				name: SchulconnexProvisioningExchange,
				type: 'direct',
			},
			{
				name: H5pEditorExchange,
				type: 'direct',
			},
		],
		uri: RabbitMqURI,
		connectionManagerOptions: {
			heartbeatIntervalInSeconds: HeartBeatIntervalInSeconds,
		},
	}),
];
@Global()
@Module({
	imports,
	providers: [SchemaRegistryService, SchemaValidatedProducerService],
	exports: [RabbitMQModule, SchemaRegistryService, SchemaValidatedProducerService],
})
export class RabbitMQWrapperModule implements OnModuleInit {
	constructor(private readonly schemaRegistry: SchemaRegistryService) {}

	async onModuleInit(): Promise<void> {
		// Register all predefined schemas when module initializes
		registerAllSchemas(this.schemaRegistry);
	}
}

@Global()
@Module({
	imports,
	providers: [SchemaRegistryService, SchemaValidatedProducerService],
	exports: [RabbitMQModule, SchemaRegistryService, SchemaValidatedProducerService],
})
export class RabbitMQWrapperTestModule implements OnModuleDestroy, OnModuleInit {
	constructor(
		private readonly amqpConnectionManager: AmqpConnectionManager,
		private readonly schemaRegistry: SchemaRegistryService
	) {}

	async onModuleInit(): Promise<void> {
		// Register all predefined schemas when module initializes
		registerAllSchemas(this.schemaRegistry);
	}

	// In tests, we need to close connections when the module is destroyed.
	public async onModuleDestroy(): Promise<void> {
		await Promise.all(
			this.amqpConnectionManager.getConnections().map((connection) => connection.managedConnection.close())
		);
	}
}
