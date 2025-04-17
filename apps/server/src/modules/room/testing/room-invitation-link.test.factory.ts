import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLink, RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { BaseFactory } from '@testing/factory/base.factory';

class RoomInvitationLinkTestFactory extends BaseFactory<RoomInvitationLink, RoomInvitationLinkProps> {}

export const roomInvitationLinkTestFactory = RoomInvitationLinkTestFactory.define(
	RoomInvitationLink,
	({ sequence }) => {
		const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		const props: RoomInvitationLinkProps = {
			id: new ObjectId().toHexString(),
			title: `room invitation link #${sequence}`,
			restrictedToCreatorSchool: true,
			isOnlyForTeachers: true,
			activeUntil: inOneWeek,
			requiresConfirmation: true,
			roomId: new ObjectId().toHexString(),
			creatorUserId: new ObjectId().toHexString(),
			creatorSchoolId: new ObjectId().toHexString(),
		};

		return props;
	}
);
