import { RoomMemberModule } from '@modules/room-member';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { RoomService } from './domain/service';
import { RoomRepo } from './repo';

@Module({
	imports: [CqrsModule, RoomMemberModule, AuthorizationModule],
	providers: [RoomRepo, RoomService],
	exports: [RoomService],
})
export class RoomModule {}
