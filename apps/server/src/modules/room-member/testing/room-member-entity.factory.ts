import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@shared/testing/factory/entity.factory';
import { RoomMemberEntity, RoomMemberEntityProps } from '../repo/entity/room-member.entity';

export const roomMemberEntityFactory = EntityFactory.define<RoomMemberEntity, RoomMemberEntityProps>(
	RoomMemberEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			roomId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			userGroupId: new ObjectId(),
		};
	}
);
