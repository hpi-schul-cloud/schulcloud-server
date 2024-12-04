import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@shared/testing/factory/entity.factory';
import { RoomMembershipEntity } from '../repo/entity/room-membership.entity';
import { RoomMembershipProps } from '../do/room-membership.do';

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
