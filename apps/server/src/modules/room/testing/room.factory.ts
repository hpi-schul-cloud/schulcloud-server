import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Room, type RoomProps } from '../domain/do/room.do';
import { RoomColor, RoomFeatures } from '../domain/type';

export const roomFactory = BaseFactory.define<Room, RoomProps>(Room, ({ sequence }) => {
	const props: RoomProps = {
		id: new ObjectId().toHexString(),
		name: `room #${sequence}`,
		color: [RoomColor.BLUE, RoomColor.RED, RoomColor.GREEN, RoomColor.MAGENTA][Math.floor(Math.random() * 4)],
		schoolId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		features: [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE],
	};

	return props;
});
