import { ObjectId } from '@mikro-orm/mongodb';
import { randomBytes } from 'node:crypto';
import {
	RoomInvitationLink,
	type RoomInvitationLinkDto,
	type RoomInvitationLinkProps,
} from '../do/room-invitation-link.do';

export class RoomInvitationLinkFactory {
	public static createInvitationLink(dto: RoomInvitationLinkDto): RoomInvitationLink {
		const props: RoomInvitationLinkProps = {
			...dto,
			id: new ObjectId().toHexString(),
			invitationToken: randomBytes(32).toString('base64url'),
		};

		const roomInvitationLink = this.buildFromProps(props);
		return roomInvitationLink;
	}

	public static buildFromProps(props: RoomInvitationLinkProps): RoomInvitationLink {
		const roomInvitationLink = new RoomInvitationLink({
			id: props.id,
			invitationToken: props.invitationToken ?? undefined,
			title: props.title,
			restrictedToCreatorSchool: props.restrictedToCreatorSchool,
			isUsableByExternalPersons: props.isUsableByExternalPersons,
			isUsableByStudents: props.isUsableByStudents,
			requiresConfirmation: props.requiresConfirmation,
			activeUntil: props.activeUntil,
			creatorUserId: props.creatorUserId,
			creatorSchoolId: props.creatorSchoolId,
			roomId: props.roomId,
		});
		return roomInvitationLink;
	}
}
