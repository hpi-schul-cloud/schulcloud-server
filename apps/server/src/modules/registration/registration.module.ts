import { Module } from '@nestjs/common';
import { RegistrationController, RegistrationUc } from './api';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';
import { RegistrationFeatureService } from './api/service';
import { RoomMembershipModule } from '@modules/room-membership';

@Module({
	controllers: [RegistrationController],
	imports: [AuthorizationModule, RoomMembershipModule],
	providers: [RegistrationRepo, RegistrationService, RegistrationUc, RegistrationFeatureService],
	exports: [],
})
export class RegistrationModule {}
