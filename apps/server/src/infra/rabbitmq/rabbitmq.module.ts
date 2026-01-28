import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { InternalRabbitMQExchangeConfig, RabbitMQModuleOptions } from './rabbitmq-module.options';
import { RabbitMQConfig } from './rabbitmq.config';

@Module({})
export class RabbitMQWrapperModule {
	public static register(options: RabbitMQModuleOptions): DynamicModule {
		return {
			module: RabbitMQWrapperModule,
			imports: [
				RabbitMQModule.forRootAsync(RabbitMQModule, {
					useFactory: (config: RabbitMQConfig, exchange: InternalRabbitMQExchangeConfig) => {
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
					inject: [options.configInjectionToken, options.exchangeConfigInjectionToken],
					imports: [
						ConfigurationModule.register(options.configInjectionToken, options.configConstructor),
						ConfigurationModule.register(options.exchangeConfigInjectionToken, options.exchangeConfigConstructor),
					],
				}),
			],
			exports: [RabbitMQModule],
		};
	}
}
