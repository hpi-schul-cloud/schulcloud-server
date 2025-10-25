import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomContentCleanupHandler } from './domain/service/room-content-cleanup.handler';
import { RoomContentService } from './domain/service/room-content.service';
import { RoomInvitationLinkService } from './domain/service/room-invitation-link.service';
import { RoomService } from './domain/service/room.service';
import { RoomContentRepo, RoomInvitationLinkDomainMapper, RoomInvitationLinkRepo, RoomRepo } from './repo';

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
		RoomContentCleanupHandler,
	],
	exports: [RoomService, RoomInvitationLinkService, RoomContentService],
})
export class RoomModule {}
