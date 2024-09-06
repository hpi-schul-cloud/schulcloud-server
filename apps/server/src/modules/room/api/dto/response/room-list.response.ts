import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { RoomResponse } from './room.response';

export class RoomListResponse extends PaginationResponse<RoomResponse[]> {
	constructor(data: RoomResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomResponse] })
	data: RoomResponse[];
}
