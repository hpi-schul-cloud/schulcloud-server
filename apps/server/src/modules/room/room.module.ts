import { Module } from '@nestjs/common';
import { RoomService } from './domain/service';
import { RoomInvitationLinkDomainMapper, RoomInvitationLinkRepo, RoomRepo } from './repo';
import { RoomInvitationLinkService } from './domain/service/room-invitation-link.service';

@Module({
	imports: [],
	providers: [RoomRepo, RoomService, RoomInvitationLinkService, RoomInvitationLinkRepo, RoomInvitationLinkDomainMapper],
	exports: [RoomService, RoomInvitationLinkService],
})
export class RoomModule {}
