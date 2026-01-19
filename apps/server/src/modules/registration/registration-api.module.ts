import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { RoomMembershipModule } from '@modules/room-membership';
import { Module } from '@nestjs/common';
import { RegistrationController, RegistrationUc } from './api';
import { RegistrationFeatureService } from './api/service';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from './registration.config';
import { RegistrationModule } from './registration.module';

@Module({
	controllers: [RegistrationController],
	imports: [
		AuthorizationModule,
		RoomMembershipModule,
		RegistrationModule,
		ConfigurationModule.register(REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig),
	],
	providers: [RegistrationUc, RegistrationFeatureService],
	exports: [],
})
export class RegistrationApiModule {}
