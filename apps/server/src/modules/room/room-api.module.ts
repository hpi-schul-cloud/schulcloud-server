import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { BoardModule } from '../board';
import { RoomMembershipModule } from '../room-membership/room-membership.module';
import { UserModule } from '../user';
import { RoomController, RoomInvitationLinkController, RoomInvitationLinkUc, RoomUc } from './api';
import { RoomModule } from './room.module';

@Module({
	imports: [RoomModule, AuthorizationModule, LoggerModule, RoomMembershipModule, BoardModule, UserModule],
	controllers: [RoomController, RoomInvitationLinkController],
	providers: [RoomUc, RoomInvitationLinkUc],
})
export class RoomApiModule {}
