import { ObjectId } from 'bson';
import { RoomInvitationLink, RoomInvitationLinkDto } from '../do/room-invitation-link.do';

export class RoomInvitationLinkFactory {
	public static createInvitationLink(props: RoomInvitationLinkDto): RoomInvitationLink {
		const roomInvitationLink = new RoomInvitationLink({
			id: new ObjectId().toHexString(),
			title: props.title,
			restrictedToCreatorSchool: props.restrictedToCreatorSchool,
			isOnlyForTeachers: props.isOnlyForTeachers,
			requiresConfirmation: props.requiresConfirmation,
			activeUntil: props.activeUntil,
			creatorUserId: props.creatorUserId,
			creatorSchoolId: props.creatorSchoolId,
			roomId: props.roomId,
		});
		return roomInvitationLink;
	}
}
