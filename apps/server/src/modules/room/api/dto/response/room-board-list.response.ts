import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { RoomBoardItemResponse } from './room-board-item.response';

export class RoomBoardListResponse extends PaginationResponse<RoomBoardItemResponse[]> {
	constructor(data: RoomBoardItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomBoardItemResponse] })
	data: RoomBoardItemResponse[];
}
