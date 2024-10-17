import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleModule } from '@modules/role';
import { GroupModule } from '@modules/group';
import { RoomMemberModule } from '@modules/room-member';
import { RoomService } from './domain/service';
import { RoomRepo } from './repo';
import { RoomRule } from './authorization/room.rule';
import { AuthorizationModule } from '../authorization';

@Module({
	imports: [CqrsModule, RoomMemberModule, GroupModule, RoleModule, AuthorizationModule],
	providers: [RoomRepo, RoomService, RoomRule],
	exports: [RoomService],
})
export class RoomModule {}
