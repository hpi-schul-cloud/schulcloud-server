import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@shared/testing/factory/entity.factory';
import { RoomMembershipEntity, RoomMembershipEntityProps } from '../repo/entity/room-membership.entity';

export const roomMembershipEntityFactory = EntityFactory.define<RoomMembershipEntity, RoomMembershipEntityProps>(
	RoomMembershipEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			roomId: new ObjectId().toHexString(),
			userGroupId: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
