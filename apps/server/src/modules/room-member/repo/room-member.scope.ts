import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { RoomMemberEntity } from './entity/room-member.entity';

export class RoomMemberScope extends Scope<RoomMemberEntity> {
	byRoomIds(roomIds: EntityId[] | undefined): this {
		if (roomIds && roomIds.length > 0) {
			this.addQuery({ roomId: { $in: roomIds.map((id) => new ObjectId(id)) } });
		}
		return this;
	}
}
