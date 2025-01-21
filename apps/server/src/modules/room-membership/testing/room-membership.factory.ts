import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { RoomMembership, RoomMembershipProps } from '../do/room-membership.do';

export const roomMembershipFactory = BaseFactory.define<RoomMembership, RoomMembershipProps>(RoomMembership, () => {
	const props: RoomMembershipProps = {
		id: new ObjectId().toHexString(),
		roomId: new ObjectId().toHexString(),
		userGroupId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return props;
});
