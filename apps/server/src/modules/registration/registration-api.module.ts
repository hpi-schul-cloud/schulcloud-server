import { AuthorizationModule } from '@modules/authorization';
import { RoomMembershipModule } from '@modules/room-membership';
import { Module } from '@nestjs/common';
import { RegistrationController, RegistrationUc } from './api';
import { RegistrationFeatureService } from './api/service';
import { RegistrationModule } from './registration.module';

@Module({
	controllers: [RegistrationController],
	imports: [AuthorizationModule, RoomMembershipModule, RegistrationModule],
	providers: [RegistrationUc, RegistrationFeatureService],
	exports: [],
})
export class RegistrationApiModule {}
