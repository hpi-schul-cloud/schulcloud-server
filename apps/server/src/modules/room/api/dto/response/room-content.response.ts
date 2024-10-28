import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { RoomContentItemResponse } from './room-content-item.response';

export class RoomContentResponse extends PaginationResponse<RoomContentItemResponse[]> {
	constructor(data: RoomContentItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomContentItemResponse] })
	data: RoomContentItemResponse[];
}
