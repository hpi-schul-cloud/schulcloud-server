import { RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';
import { RoomInvitationLinkListResponse } from '../dto/response/room-invitation-link-list.response';
import { RoomInvitationLinkResponse } from '../dto/response/room-invitation-link.response';

export class RoomInvitationLinkMapper {
	public static mapToRoomInvitationLinkResponse(link: RoomInvitationLinkProps): RoomInvitationLinkResponse {
		const response = new RoomInvitationLinkResponse({
			id: link.id,
			title: link.title,
			restrictedToCreatorSchool: link.restrictedToCreatorSchool,
			isUsableByExternalPersons: link.isUsableByExternalPersons,
			isUsableByStudents: link.isUsableByStudents,
			activeUntil: link.activeUntil,
			requiresConfirmation: link.requiresConfirmation,
			roomId: link.roomId,
			creatorUserId: link.creatorUserId,
			creatorSchoolId: link.creatorSchoolId,
		});

		return response;
	}

	public static mapToRoomInvitationLinkListResponse(
		links: RoomInvitationLinkResponse[]
	): RoomInvitationLinkListResponse {
		const mappedLinks = links.map((link) => this.mapToRoomInvitationLinkResponse(link));
		const response = new RoomInvitationLinkListResponse(mappedLinks);

		return response;
	}
}
