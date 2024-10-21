import { GroupModule } from '@modules/group';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomMemberRepo } from './repo/room-member.repo';
import { RoomMemberService } from './service/room-member.service';

@Module({
	imports: [CqrsModule, GroupModule],
	providers: [RoomMemberService, RoomMemberRepo],
	exports: [RoomMemberService],
})
export class RoomMemberModule {}
