import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { RoomArrangementEntity, type RoomArrangementEntityProps } from '../repo/entity/room-arrangement.entity';

/**
 * Builds documents in the legacy shape (only `items`) by default.
 * Pass `schemaVersion`, `revision`, `ungroupedRoomIds`, `groups` and `confirmGroupDeletion` for the grouped shape.
 */
export const roomArrangementEntityFactory = EntityFactory.define<RoomArrangementEntity, RoomArrangementEntityProps>(
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
