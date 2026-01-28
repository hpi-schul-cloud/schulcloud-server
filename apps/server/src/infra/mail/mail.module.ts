import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { RabbitMQWrapperModule } from '@infra/rabbitmq/rabbitmq.module';
import { DynamicModule, Module } from '@nestjs/common';
import { InternalMailConfig, MailModuleOptions } from './interfaces';
import { MailService } from './mail.service';

@Module({})
export class MailModule {
	public static register(options: MailModuleOptions): DynamicModule {
		const providers = [
			{
				provide: MailService,
				useFactory(amqpConnection: AmqpConnection, config: InternalMailConfig): MailService {
					return new MailService(amqpConnection, config);
				},
				inject: [AmqpConnection, options.exchangeInjectionToken],
			},
		];

		return {
			module: MailModule,
			imports: [
				ConfigurationModule.register(options.exchangeInjectionToken, options.exchangeConstructor),
				RabbitMQWrapperModule.register(options),
			],
			providers,
			exports: [MailService],
		};
	}
}
