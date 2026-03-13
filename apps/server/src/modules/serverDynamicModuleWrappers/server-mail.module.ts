import { MAIL_CONFIG_TOKEN, MailConfig, MailModule } from '@infra/mail';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		MailModule.register({
			exchangeConfigConstructor: MailConfig,
			exchangeConfigInjectionToken: MAIL_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	exports: [MailModule],
})
export class ServerMailModule {}
