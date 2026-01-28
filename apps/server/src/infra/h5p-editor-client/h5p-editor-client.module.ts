import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { InternalRabbitMQExchange, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { H5pClientModuleOptions } from './h5p-client-module.options';
import { H5pEditorProducer } from './service';

@Module({})
export class H5pEditorClientModule {
	public static register(options: H5pClientModuleOptions): DynamicModule {
		return {
			module: H5pEditorClientModule,
			imports: [
				RabbitMQWrapperModule.register(options),
				ConfigurationModule.register(options.exchangeInjectionToken, options.exchangeConstructor),
			],
			providers: [
				{
					provide: H5pEditorProducer,
					useFactory(amqpConnection: AmqpConnection, config: InternalRabbitMQExchange): H5pEditorProducer {
						return new H5pEditorProducer(amqpConnection, config);
					},
					inject: [AmqpConnection, options.exchangeInjectionToken],
				},
			],
			exports: [H5pEditorProducer],
		};
	}
}
