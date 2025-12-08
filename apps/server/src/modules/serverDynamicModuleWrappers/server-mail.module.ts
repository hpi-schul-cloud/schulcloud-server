import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MailModule } from '@infra/mail';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		MailModule.forRoot({
			exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
			routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
		}),
	],
	exports: [MailModule],
})
export class ServerMailModule {}
