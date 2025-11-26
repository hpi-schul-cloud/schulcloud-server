import { Configuration } from '@hpi-schul-cloud/commons';
import { MailModule } from '@infra/mail';
import { Module } from '@nestjs/common';
import { RegistrationUc } from './api';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';

@Module({
	imports: [
		MailModule.forRoot({
			exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
			routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
		}),
	],
	providers: [RegistrationRepo, RegistrationService, RegistrationUc],
	exports: [RegistrationService],
})
export class RegistrationModule {}
