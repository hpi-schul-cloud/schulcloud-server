import { Configuration } from '@hpi-schul-cloud/commons';
import { MailModule } from '@infra/mail';
import { AuthorizationModule } from '@modules/authorization';
import { RoomMembershipModule } from '@modules/room-membership';
import { Module } from '@nestjs/common';
import { RegistrationController, RegistrationUc } from './api';
import { RegistrationFeatureService } from './api/service';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';

@Module({
	controllers: [RegistrationController],
	imports: [
		AuthorizationModule,
		MailModule.forRoot({
			exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
			routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
		}),
		RoomMembershipModule,
	],
	providers: [RegistrationRepo, RegistrationService, RegistrationUc, RegistrationFeatureService],
	exports: [],
})
export class RegistrationModule {}
