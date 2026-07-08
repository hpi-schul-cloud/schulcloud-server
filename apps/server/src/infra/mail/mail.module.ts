import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { Logger, LoggerModule } from '@infra/logger';
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
				useFactory(amqpConnection: AmqpConnection, config: InternalMailConfig, logger: Logger): MailService {
					return new MailService(amqpConnection, config, logger);
				},
				inject: [AmqpConnection, options.exchangeConfigInjectionToken, Logger],
			},
		];

		return {
			module: MailModule,
			imports: [
				ConfigurationModule.register(options.exchangeConfigInjectionToken, options.exchangeConfigConstructor),
				RabbitMQWrapperModule.register({ ...options, connectionName: 'mail' }),
				LoggerModule,
			],
			providers,
			exports: [MailService],
		};
	}
}
