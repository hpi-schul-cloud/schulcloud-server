import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { RoomStatsItemResponse } from './room-stats-item.response';

export class RoomStatsListResponse extends PaginationResponse<RoomStatsItemResponse[]> {
	constructor(data: RoomStatsItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomStatsItemResponse] })
	data: RoomStatsItemResponse[];
}
