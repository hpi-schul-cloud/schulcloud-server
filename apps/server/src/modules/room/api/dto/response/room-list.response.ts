import { ApiProperty } from '@nestjs/swagger';
import { RoomItemResponse } from './room-item.response';

export class RoomListResponse {
	constructor(data: RoomItemResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [RoomItemResponse] })
	data: RoomItemResponse[];
}
