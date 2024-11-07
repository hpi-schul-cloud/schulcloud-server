import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RoomMemberModule } from '../room-member/room-member.module';
import { RoomController, RoomUc } from './api';
import { RoomModule } from './room.module';
import { UserModule } from '../user';

@Module({
	imports: [RoomModule, AuthorizationModule, LoggerModule, RoomMemberModule, UserModule],
	controllers: [RoomController],
	providers: [RoomUc],
})
export class RoomApiModule {}
