import { GroupModule } from '@modules/group';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { RoleModule } from '../role';
import { RoomMemberRule } from './authorization/room-member.rule';
import { RoomMemberRepo } from './repo/room-member.repo';
import { RoomMemberService } from './service/room-member.service';

@Module({
	imports: [AuthorizationModule, CqrsModule, GroupModule, RoleModule],
	providers: [RoomMemberService, RoomMemberRepo, RoomMemberRule],
	exports: [RoomMemberService],
})
export class RoomMemberModule {}
