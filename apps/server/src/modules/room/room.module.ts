import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomArrangementService, RoomContentService, RoomService } from './domain/service';
import { RoomInvitationLinkService } from './domain/service/room-invitation-link.service';
import {
	RoomArrangementRepo,
	RoomContentRepo,
	RoomInvitationLinkDomainMapper,
	RoomInvitationLinkRepo,
	RoomRepo,
} from './repo';

@Module({
	imports: [CqrsModule, ServerMailModule],
	providers: [
		RoomRepo,
		RoomService,
		RoomInvitationLinkService,
		RoomInvitationLinkRepo,
		RoomInvitationLinkDomainMapper,
		RoomContentService,
		RoomContentRepo,
		RoomArrangementService,
		RoomArrangementRepo,
	],
	exports: [RoomService, RoomInvitationLinkService, RoomContentService, RoomArrangementService],
})
export class RoomModule {}
