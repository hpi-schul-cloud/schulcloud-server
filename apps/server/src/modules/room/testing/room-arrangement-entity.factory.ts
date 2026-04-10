import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { RoomArrangementProps } from '../domain';
import { RoomArrangementEntity } from '../repo/entity/room-arrangement.entity';

export const roomArrangementEntityFactory = EntityFactory.define<RoomArrangementEntity, RoomArrangementProps>(
	RoomArrangementEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
