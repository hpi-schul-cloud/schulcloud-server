import { AmqpConnectionManager, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Global, Module, OnApplicationShutdown } from '@nestjs/common';

/**
 * https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq#usage
 * we want to have the RabbitMQModule globally available, since it provides via a factory the AMQPConnection.
 * You shall not explicitly declare the AMQPConnection in your modules since it will create a new AMQPConnection which will not be initialized!
 *
 * Therefore, the combination of @Global() and export: [RabbitMQModule] is required.
 */

const imports = [
	RabbitMQModule.forRoot(RabbitMQModule, {
		exchanges: [
			{
				name: Configuration.get('MAIL_SEND_EXCHANGE') as string,
				type: 'direct',
			},
			{
				name: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
				type: 'direct',
			},
		],
		uri: Configuration.get('RABBITMQ_URI') as string,
	}),
];
@Global()
@Module({
	imports,
	exports: [RabbitMQModule],
})
export class RabbitMQWrapperModule {}

@Global()
@Module({
	imports,
	exports: [RabbitMQModule],
})
export class RabbitMQWrapperTestModule {
	constructor(private readonly amqpConnectionManager: AmqpConnectionManager) {}

	// In tests we need to close connections when the module is destroyed.
	async onModuleDestroy() {
		await Promise.all(
			this.amqpConnectionManager.getConnections().map((connection) => connection.managedConnection.close())
		);
	}
}
