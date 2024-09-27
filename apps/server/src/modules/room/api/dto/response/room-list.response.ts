import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { RoomItemResponse } from './room-item.response';

export class RoomListResponse extends PaginationResponse<RoomItemResponse[]> {
	constructor(data: RoomItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomItemResponse] })
	data: RoomItemResponse[];
}
