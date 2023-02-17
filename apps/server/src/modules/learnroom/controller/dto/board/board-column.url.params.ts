import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BoardColumnUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the board.',
		required: true,
		nullable: false,
	})
	boardId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the column.',
		required: true,
		nullable: false,
	})
	columnId!: string;
}
