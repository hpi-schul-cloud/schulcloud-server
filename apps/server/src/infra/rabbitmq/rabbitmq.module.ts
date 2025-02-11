import { AmqpConnectionManager, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { SchulconnexProvisioningEvents } from './exchange';
import {
	AntivirusExchange,
	FilesPreviewExchange,
	FilesStorageExchange,
	MailSendExchange,
	RabbitMqURI,
	SchulconnexProvisioningExchange,
} from './rabbitmq.config';

/**
 * https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq#usage
 * we want to have the RabbitMQModule globally available, since it provides via a factory the AMQPConnection.
 * You shall not explicitly declare the AMQPConnection in your modules since it will create a new AMQPConnection which will not be initialized!
 *
 * Therefore, the combination of @Global() and export: [RabbitMQModule] is required.
 */

const imports = [
	RabbitMQModule.forRoot(RabbitMQModule, {
		uri: RabbitMqURI,
		// Please don't change the global prefetch count, if you need constraint, change it at channel level
		prefetchCount: 5,
		exchanges: [
			{
				name: MailSendExchange,
				type: 'direct',
			},
			{
				name: AntivirusExchange,
				type: 'direct',
			},
			{
				name: FilesStorageExchange,
				type: 'direct',
			},
			{
				name: FilesPreviewExchange,
				type: 'direct',
			},
			{
				name: SchulconnexProvisioningExchange,
				type: 'direct',
			},
		],
		channels: {
			[SchulconnexProvisioningEvents.GROUP_PROVISIONING]: {
				prefetchCount: Configuration.get('SCHULCONNEX_PROVISIONING_AMQP__GROUP_PROVISIONING_PREFETCH_COUNT') as number,
				default: false,
			},
			[SchulconnexProvisioningEvents.GROUP_REMOVAL]: {
				prefetchCount: Configuration.get('SCHULCONNEX_PROVISIONING_AMQP__GROUP_REMOVAL_PREFETCH_COUNT') as number,
				default: false,
			},
			[SchulconnexProvisioningEvents.LICENSE_PROVISIONING]: {
				prefetchCount: Configuration.get(
					'SCHULCONNEX_PROVISIONING_AMQP__LICENSE_PROVISIONING_PREFETCH_COUNT'
				) as number,
				default: false,
			},
		},
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
export class RabbitMQWrapperTestModule implements OnModuleDestroy {
	constructor(private readonly amqpConnectionManager: AmqpConnectionManager) {}

	// In tests we need to close connections when the module is destroyed.
	async onModuleDestroy() {
		await Promise.all(
			this.amqpConnectionManager.getConnections().map((connection) => connection.managedConnection.close())
		);
	}
}
