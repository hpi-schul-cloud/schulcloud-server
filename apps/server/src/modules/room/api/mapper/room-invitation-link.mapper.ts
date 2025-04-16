import { Page } from '@shared/domain/domainobject';
import { RoomPaginationParams } from '../dto/request/room-pagination.params';
import { RoomInvitationLinkProps } from '../../domain/do/room-invitation-link.do';
import { RoomInvitationLinkResponse } from '../dto/response/room-invitation-link.response';
import { RoomInvitationLinkListResponse } from '../dto/response/room-invitation-link-list.response';

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

	public static mapToRoomInvitionLinkListResponse(
		links: Page<RoomInvitationLinkResponse>,
		pagination: RoomPaginationParams
	): RoomInvitationLinkListResponse {
		const responseData: RoomInvitationLinkResponse[] = links.data.map(
			(link): RoomInvitationLinkResponse => this.mapToRoomInvitionLinkResponse(link)
		);
		const response = new RoomInvitationLinkListResponse(responseData, links.total, pagination.skip, pagination.limit);

		return response;
	}
}
