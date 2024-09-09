import { BaseFactory } from '@shared/testing/factory/base.factory';
import { RoomEntity, RoomEntityProps } from '../repo/entity/room.entity';

export const roomEntityFactory = BaseFactory.define<RoomEntity, RoomEntityProps>(RoomEntity, ({ sequence }) => {
	return {
		name: `room #${sequence}`,
		color: ['blue', 'red', 'green', 'yellow'][Math.floor(Math.random() * 4)],
		startDate: new Date(),
		untilDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
	};
});
