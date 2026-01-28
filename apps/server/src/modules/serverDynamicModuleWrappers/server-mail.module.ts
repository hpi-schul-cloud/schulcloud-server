import { MAIL_CONFIG_TOKEN, MailConfig, MailModule } from '@infra/mail';
import { RABBITMQ_CONFIG_TOKEN, RabbitMqConfig } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		MailModule.register({
			exchangeConstructor: MailConfig,
			exchangeInjectionToken: MAIL_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMqConfig,
		}),
	],
	exports: [MailModule],
})
export class ServerMailModule {}
