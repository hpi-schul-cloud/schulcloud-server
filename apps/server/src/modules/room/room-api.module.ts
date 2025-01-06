import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '../board';
import { RoomMembershipModule } from '../room-membership/room-membership.module';
import { UserModule } from '../user';
import { RoomController, RoomUc } from './api';
import { RoomModule } from './room.module';

@Module({
	imports: [RoomModule, AuthorizationModule, LoggerModule, RoomMembershipModule, BoardModule, UserModule],
	controllers: [RoomController],
	providers: [RoomUc],
})
export class RoomApiModule {}
