import { RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';
import { RoomInvitationLinkResponse } from '../dto/response/room-invitation-link.response';

export class RoomInvitationLinkMapper {
	public static mapToRoomInvitationLinkResponse(link: RoomInvitationLinkProps): RoomInvitationLinkResponse {
		const response = new RoomInvitationLinkResponse({
			id: link.id,
			title: link.title,
			restrictedToCreatorSchool: link.restrictedToCreatorSchool,
			isOnlyForTeachers: link.isOnlyForTeachers,
			activeUntil: link.activeUntil,
			requiresConfirmation: link.requiresConfirmation,
			roomId: link.roomId,
			creatorUserId: link.creatorUserId,
			creatorSchoolId: link.creatorSchoolId,
		});

		return response;
	}

	public static mapToRoomInvitationLinksResponse(links: RoomInvitationLinkResponse[]): RoomInvitationLinkResponse[] {
		const response: RoomInvitationLinkResponse[] = links.map(
			(link): RoomInvitationLinkResponse => this.mapToRoomInvitationLinkResponse(link)
		);

		return response;
	}
}
