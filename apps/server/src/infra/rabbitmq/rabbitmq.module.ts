import { AmqpConnectionManager, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Global, Module, OnModuleDestroy } from '@nestjs/common';
import { InternalRabbitMQExchange, RabbitMQModuleOptions } from './rabbitmq-module.options';
import { RabbitMqConfig } from './rabbitmq.config';

@Module({})
export class RabbitMQWrapperModule {
	public static register(options: RabbitMQModuleOptions): DynamicModule {
		return {
			module: RabbitMQWrapperModule,
			imports: [
				RabbitMQModule.forRootAsync(RabbitMQModule, {
					useFactory: (config: RabbitMqConfig, exchange: InternalRabbitMQExchange) => {
						return {
							prefetchCount: config.prefetchCount,
							exchanges: [
								{
									name: exchange.exchangeName,
									type: exchange.exchangeType,
								},
							],
							uri: config.uri,
							connectionManagerOptions: {
								heartbeatIntervalInSeconds: config.heartBeatIntervalInSeconds,
							},
						};
					},
					inject: [options.configInjectionToken, options.exchangeInjectionToken],
					imports: [
						ConfigurationModule.register(options.configInjectionToken, options.configConstructor),
						ConfigurationModule.register(options.exchangeInjectionToken, options.exchangeConstructor),
					],
				}),
			],
			exports: [RabbitMQModule],
		};
	}
}

@Global()
@Module({
	imports: [RabbitMQWrapperModule],
	exports: [RabbitMQModule],
})
export class RabbitMQWrapperTestModule implements OnModuleDestroy {
	constructor(private readonly amqpConnectionManager: AmqpConnectionManager) {}

	// In tests, we need to close connections when the module is destroyed.
	public async onModuleDestroy(): Promise<void> {
		await Promise.all(
			this.amqpConnectionManager.getConnections().map((connection) => connection.managedConnection.close())
		);
	}
}
