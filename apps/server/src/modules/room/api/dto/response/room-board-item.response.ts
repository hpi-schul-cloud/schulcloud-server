import { ApiProperty } from '@nestjs/swagger';
import { BoardLayout } from '@modules/board';
import { BoardOperation, BoardOperationValues } from '@modules/board/authorisation/board-node.rule';

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

	@ApiProperty({
		type: 'object',
		properties: BoardOperationValues.reduce((acc, op) => {
			acc[op] = { type: 'boolean' };
			return acc;
		}, {}),
		additionalProperties: false,
		required: [...BoardOperationValues],
	})
	public allowedOperations: Record<BoardOperation, boolean>;

	constructor(item: RoomBoardItemResponse) {
		this.id = item.id;
		this.title = item.title;
		this.layout = item.layout;
		this.isVisible = item.isVisible;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
		this.allowedOperations = item.allowedOperations;
	}
}
