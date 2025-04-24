import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { RoomInvitationLinkResponse } from './room-invitation-link.response';

export class RoomInvitationLinkListResponse {
	@ApiProperty({
		description: 'The list of room invitation links',
		type: 'array',
		items: {
			oneOf: [{ $ref: getSchemaPath(RoomInvitationLinkResponse) }],
		},
	})
	roomInvitationLinks: RoomInvitationLinkResponse[];

	constructor(roomInvitationLinks: RoomInvitationLinkResponse[]) {
		this.roomInvitationLinks = roomInvitationLinks;
	}
}
