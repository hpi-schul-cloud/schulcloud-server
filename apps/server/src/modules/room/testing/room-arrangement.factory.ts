import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Factory } from 'fishery';
import { RoomArrangement, type RoomArrangementProps } from '../domain/do/room-arrangement.do';
import { type RoomArrangementRoomInfo, type RoomGroupProps } from '../domain/type';

export const roomArrangementFactory = BaseFactory.define<RoomArrangement, RoomArrangementProps>(RoomArrangement, () => {
	const props: RoomArrangementProps = {
		id: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		revision: 0,
		ungroupedRoomIds: [],
		groups: [],
		confirmGroupDeletion: true,
	};

	return props;
});

export const roomGroupPropsFactory = Factory.define<RoomGroupProps>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `group #${sequence}`,
		collapsed: false,
		roomIds: [],
	};
});

export const roomArrangementRoomInfoFactory = Factory.define<RoomArrangementRoomInfo>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)),
		isVisible: true,
	};
});
