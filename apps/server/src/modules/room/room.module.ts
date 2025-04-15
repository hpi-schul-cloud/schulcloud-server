import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomService } from './domain/service';
import { RoomInvitationLinkDomainMapper, RoomInvitationLinkRepo, RoomRepo } from './repo';

@Module({
	imports: [CqrsModule],
	providers: [RoomRepo, RoomService, RoomInvitationLinkRepo, RoomInvitationLinkDomainMapper],
	exports: [RoomService],
})
export class RoomModule {}
