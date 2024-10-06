import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RoomMembersController } from './api/room-member.controller';
import { RoomMembersUc } from './api/room-member.uc';
import { RoomMemberModule } from './room-member.module';

@Module({
	imports: [RoomMemberModule, AuthorizationModule, LoggerModule],
	controllers: [RoomMembersController],
	providers: [RoomMembersUc],
})
export class RoomMemberApiModule {}
