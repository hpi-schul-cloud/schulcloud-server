import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { RoomMembershipProps } from '../do/room-membership.do';
import { RoomMembershipEntity } from '../repo/entity/room-membership.entity';

export const roomMembershipEntityFactory = EntityFactory.define<RoomMembershipEntity, RoomMembershipProps>(
	RoomMembershipEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			roomId: new ObjectId().toHexString(),
			userGroupId: new ObjectId().toHexString(),
			schoolId: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
