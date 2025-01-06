import { ApiProperty } from '@nestjs/swagger';
import { BoardLayout } from '@modules/board';

export class RoomBoardItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	title: string;

	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	layout: BoardLayout;

	@ApiProperty({ type: Boolean })
	isVisible: boolean;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: RoomBoardItemResponse) {
		this.id = item.id;
		this.title = item.title;
		this.layout = item.layout;
		this.isVisible = item.isVisible;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
