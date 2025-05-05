import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLink, RoomInvitationLinkDto, RoomInvitationLinkProps } from '../do/room-invitation-link.do';

export class RoomInvitationLinkFactory {
	public static createInvitationLink(dto: RoomInvitationLinkDto): RoomInvitationLink {
		const props: RoomInvitationLinkProps = {
			id: new ObjectId().toHexString(),
			...dto,
		};

		const roomInvitationLink = this.buildFromProps(props);
		return roomInvitationLink;
	}

	public static buildFromProps(props: RoomInvitationLinkProps): RoomInvitationLink {
		const roomInvitationLink = new RoomInvitationLink({
			id: props.id,
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
