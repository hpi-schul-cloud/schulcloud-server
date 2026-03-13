import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { RoomContentProps } from '../domain';
import { RoomContentEntity } from '../repo/entity/room-content.entity';

export const roomContentEntityFactory = EntityFactory.define<RoomContentEntity, RoomContentProps>(
	RoomContentEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			roomId: new ObjectId().toHexString(),
			items: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
