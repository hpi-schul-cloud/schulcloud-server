import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { RoomMember, RoomMemberProps } from '../do/room-member.do';

export const roomMemberFactory = BaseFactory.define<RoomMember, RoomMemberProps>(RoomMember, () => {
	const props: RoomMemberProps = {
		id: new ObjectId().toHexString(),
		roomId: new ObjectId().toHexString(),
		userGroupId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return props;
});
