import { AuthorizationModule } from '@modules/authorization';
import { GroupModule, GroupRepo, GroupService } from '@modules/group';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleRepo } from '@shared/repo';
import { RoomMemberService } from './service/room-member.service';
import { RoomMemberRepo } from './repo/room-member.repo';
import { RoomMemberRule } from './authorization/room-member.rule';

@Module({
	imports: [AuthorizationModule, CqrsModule, GroupModule, RoleModule],
	providers: [RoomMemberRule, RoomMemberService, RoomMemberRepo, GroupService, GroupRepo, RoleRepo],
	exports: [RoomMemberService],
})
export class RoomMemberModule {}
