import { Module } from '@nestjs/common';
import { RoomContentService, RoomService } from './domain/service';
import { RoomContentRepo, RoomInvitationLinkDomainMapper, RoomInvitationLinkRepo, RoomRepo } from './repo';
import { RoomInvitationLinkService } from './domain/service/room-invitation-link.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
	imports: [CqrsModule],
	providers: [
		RoomRepo,
		RoomService,
		RoomInvitationLinkService,
		RoomInvitationLinkRepo,
		RoomInvitationLinkDomainMapper,
		RoomContentService,
		RoomContentRepo,
	],
	exports: [RoomService, RoomInvitationLinkService, RoomContentService],
})
export class RoomModule {}
