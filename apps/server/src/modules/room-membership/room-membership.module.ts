import { GroupModule } from '@modules/group';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { RoleModule } from '../role';
import { RoomMembershipRule } from './authorization/room-membership.rule';
import { RoomMembershipRepo } from './repo/room-membership.repo';
import { RoomMembershipService } from './service/room-membership.service';

@Module({
	imports: [AuthorizationModule, CqrsModule, GroupModule, RoleModule],
	providers: [RoomMembershipService, RoomMembershipRepo, RoomMembershipRule],
	exports: [RoomMembershipService],
})
export class RoomMembershipModule {}
