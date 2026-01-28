import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
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
