import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLink, type RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { BaseFactory } from '@testing/factory/base.factory';
import { randomBytes } from 'node:crypto';

class RoomInvitationLinkTestFactory extends BaseFactory<RoomInvitationLink, RoomInvitationLinkProps> {}

export const roomInvitationLinkTestFactory = RoomInvitationLinkTestFactory.define(
	RoomInvitationLink,
	({ sequence }) => {
		const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		const props: RoomInvitationLinkProps = {
			id: new ObjectId().toHexString(),
			invitationToken: randomBytes(32).toString('base64url'),
			title: `room invitation link #${sequence}`,
			restrictedToCreatorSchool: true,
			isUsableByExternalPersons: false,
			isUsableByStudents: false,
			activeUntil: inOneWeek,
			requiresConfirmation: true,
			roomId: new ObjectId().toHexString(),
			creatorUserId: new ObjectId().toHexString(),
			creatorSchoolId: new ObjectId().toHexString(),
		};

		return props;
	}
);
