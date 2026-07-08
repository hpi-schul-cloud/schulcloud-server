import { ApiProperty } from '@nestjs/swagger';
import { RoomInvitationLinkResponse } from './room-invitation-link.response';

export class RoomInvitationLinkListResponse {
	@ApiProperty({ type: [RoomInvitationLinkResponse] })
	roomInvitationLinks: RoomInvitationLinkResponse[];

	constructor(roomInvitationLinks: RoomInvitationLinkResponse[]) {
		this.roomInvitationLinks = roomInvitationLinks;
	}
}
