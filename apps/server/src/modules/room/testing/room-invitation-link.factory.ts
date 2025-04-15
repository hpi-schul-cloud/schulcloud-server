import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { RoleName } from '@modules/role';
import { BaseFactory } from '@testing/factory/base.factory';

class RoomInvitationLinkFactory extends BaseFactory<RoomInvitationLink, RoomInvitationLinkProps> {}

export const roomInvitationLinkFactory = RoomInvitationLinkFactory.define(RoomInvitationLink, ({ sequence }) => {
	const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
	const props: RoomInvitationLinkProps = {
		id: new ObjectId().toHexString(),
		title: `room invitation link #${sequence}`,
		restrictedToSchoolId: new ObjectId().toHexString(),
		isOnlyForTeachers: true,
		activeUntil: inOneWeek,
		startingRole: RoleName.ROOMVIEWER,
		roomId: new ObjectId().toHexString(),
		createdById: new ObjectId().toHexString(),
	};

	return props;
});
