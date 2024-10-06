import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { RoleModule, RoleService } from '@modules/role';
import { GroupModule, GroupService } from '@modules/group';
import { RoomMemberService } from './service/room-member.service';
import { RoomMemberRepo } from './repo/room-member.repo';

@Module({
	imports: [CqrsModule, GroupModule, RoleModule],
	providers: [RoomMemberService, RoomMemberRepo, GroupService, RoleService],
	exports: [RoomMemberService],
})
export class RoomMemberModule {}
