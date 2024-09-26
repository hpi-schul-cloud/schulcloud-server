import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@shared/testing/factory/entity.factory';
import { RoomEntity } from '../repo/entity/room.entity';
import { RoomProps } from '../domain';
import { RoomColor } from '../domain/type';

export const roomEntityFactory = EntityFactory.define<RoomEntity, RoomProps>(RoomEntity, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `room #${sequence}`,
		color: [RoomColor.BLUE, RoomColor.RED, RoomColor.GREEN, RoomColor.MAGENTA][Math.floor(Math.random() * 4)],
		startDate: new Date(),
		endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
