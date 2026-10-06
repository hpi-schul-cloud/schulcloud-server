import { ApiProperty } from '@nestjs/swagger';
import { RoomArchivedItemResponse } from './room-archived-item.response';

export class RoomArchivedListResponse {
	constructor(data: RoomArchivedItemResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [RoomArchivedItemResponse] })
	data: RoomArchivedItemResponse[];
}
