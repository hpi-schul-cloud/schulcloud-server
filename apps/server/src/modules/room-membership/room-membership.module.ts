import { GroupModule } from '@modules/group';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { RoleModule } from '../role';
import { RoomModule } from '../room/room.module';
import { UserModule } from '../user';
import { RoomMemberRule } from './authorization/room-member.rule';
import { RoomRule } from './authorization/room.rule';
import { RoomInvitationLinkRule } from './authorization/room-invitation-link.rule';
import { RoomMembershipRepo } from './repo/room-membership.repo';
import { RoomMembershipService } from './service/room-membership.service';
import { SchoolModule } from '@modules/school';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room';
import { ConfigurationModule } from '@infra/configuration';

@Module({
	imports: [
		AuthorizationModule,
		CqrsModule,
		GroupModule,
		RoleModule,
		RoomModule,
		UserModule,
		SchoolModule,
		ConfigurationModule.register(ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig),
	],
	providers: [RoomMembershipService, RoomMembershipRepo, RoomRule, RoomMemberRule, RoomInvitationLinkRule],
	exports: [RoomMembershipService, RoomRule, RoomMemberRule, RoomInvitationLinkRule],
})
export class RoomMembershipModule {}
