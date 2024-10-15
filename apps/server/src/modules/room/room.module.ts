import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleModule } from '@modules/role';
import { GroupModule } from '@modules/group';
import { RoomMemberModule } from '@modules/room-member';
import { RoomService } from './domain/service';
import { RoomRepo } from './repo';

@Module({
	imports: [CqrsModule, RoomMemberModule, GroupModule, RoleModule],
	providers: [RoomRepo, RoomService],
	exports: [RoomService],
})
export class RoomModule {}
