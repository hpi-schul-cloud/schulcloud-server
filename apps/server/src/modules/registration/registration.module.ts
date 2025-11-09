import { Module } from '@nestjs/common';
import { RegistrationController, RegistrationUc } from './api';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationService } from './domain';
import { RegistrationRepo } from './repo';
import { RegistrationFeatureService } from './api/service';
import { RoomApiModule } from '@modules/room/room-api.module';
import { RoomModule } from '@modules/room';

@Module({
	controllers: [RegistrationController],
	imports: [AuthorizationModule, RoomModule, RoomApiModule],
	providers: [RegistrationRepo, RegistrationService, RegistrationUc, RegistrationFeatureService],
	exports: [],
})
export class RegistrationModule {}
