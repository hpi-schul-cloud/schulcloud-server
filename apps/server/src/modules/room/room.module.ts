import { ConfigurationModule } from '@infra/configuration';
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
import { ROOM_CONFIG_TOKEN, RoomConfig } from './room.config';

@Module({
	imports: [CqrsModule, ServerMailModule, ConfigurationModule.register(ROOM_CONFIG_TOKEN, RoomConfig)],
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
