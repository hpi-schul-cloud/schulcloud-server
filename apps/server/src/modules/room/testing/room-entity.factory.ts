import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { type RoomProps } from '../domain';
import { RoomColor } from '../domain/type';
import { RoomEntity } from '../repo/entity/room.entity';

export const roomEntityFactory = EntityFactory.define<RoomEntity, RoomProps>(RoomEntity, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `room #${sequence}`,
		color: [RoomColor.BLUE, RoomColor.RED, RoomColor.GREEN, RoomColor.MAGENTA][Math.floor(Math.random() * 4)],
		schoolId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		features: [],
	};
});
