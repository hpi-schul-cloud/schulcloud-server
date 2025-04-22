import { Page } from '@shared/domain/domainobject';
import { RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';
import { RoomInvitationLinkResponse } from '../dto/response/room-invitation-link.response';

export class RoomInvitationLinkMapper {
	public static mapToRoomInvitionLinkResponse(link: RoomInvitationLinkProps): RoomInvitationLinkResponse {
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

	public static mapToRoomInvitionLinksResponse(links: RoomInvitationLinkResponse[]): RoomInvitationLinkResponse[] {
		const response: RoomInvitationLinkResponse[] = links.map(
			(link): RoomInvitationLinkResponse => this.mapToRoomInvitionLinkResponse(link)
		);

		return response;
	}
}
