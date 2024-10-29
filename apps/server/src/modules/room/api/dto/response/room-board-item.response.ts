import { ApiProperty } from '@nestjs/swagger';

export class RoomBoardItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	title: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: RoomBoardItemResponse) {
		this.id = item.id;
		this.title = item.title;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
