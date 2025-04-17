import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { RoomInvitationLinkResponse } from './room-invitation-link.response';

export class RoomInvitationLinkListResponse extends PaginationResponse<RoomInvitationLinkResponse[]> {
	constructor(data: RoomInvitationLinkResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomInvitationLinkResponse] })
	data: RoomInvitationLinkResponse[];
}
