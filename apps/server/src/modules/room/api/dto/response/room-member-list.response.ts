import { ApiProperty } from '@nestjs/swagger';
import { RoomMemberResponse } from './room-member.response';

export class RoomMemberListResponse {
	constructor(data: RoomMemberResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [RoomMemberResponse] })
	public data: RoomMemberResponse[];
}
