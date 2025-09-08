import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Room, RoomProps } from '../domain/do/room.do';
import { RoomColor, RoomFeatures } from '../domain/type';

export const roomFactory = BaseFactory.define<Room, RoomProps>(Room, ({ sequence }) => {
	const props: RoomProps = {
		id: new ObjectId().toHexString(),
		name: `room #${sequence}`,
		color: [RoomColor.BLUE, RoomColor.RED, RoomColor.GREEN, RoomColor.MAGENTA][Math.floor(Math.random() * 4)],
		schoolId: new ObjectId().toHexString(),
		startDate: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		features: [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE],
	};

	return props;
});
