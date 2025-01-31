import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BoardUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the board.',
		required: true,
		nullable: false,
	})
	public boardId: string;

	constructor(props: Readonly<BoardUrlParams>) {
		this.boardId = props.boardId;
	}
}
