import { AuthorizationModule } from '@modules/authorization';
import { GroupModule, GroupRepo, GroupService } from '@modules/group';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleRepo } from '@shared/repo';
import { RoomMemberService } from './service/room-member.service';
import { RoomMemberRepo } from './repo/room-member.repo';

@Module({
	imports: [AuthorizationModule, CqrsModule, GroupModule, RoleModule],
	providers: [RoomMemberService, RoomMemberRepo, GroupService, GroupRepo, RoleRepo],
	exports: [RoomMemberService, RoomMemberRepo],
})
export class RoomMemberModule {}
