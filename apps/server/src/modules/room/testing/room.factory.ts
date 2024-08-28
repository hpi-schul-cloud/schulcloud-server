import { BaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Room, RoomProps } from '../domain/do/room.do';

export const roomFactory = BaseFactory.define<Room, RoomProps>(Room, ({ sequence }) => {
	const props: RoomProps = {
		id: new ObjectId().toHexString(),
		name: `room #${sequence}`,
		color: ['blue', 'red', 'green', 'yellow'][Math.floor(Math.random() * 4)],
		startDate: new Date(),
		untilDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
	};

	return props;
});
