import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BoardCardUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the board.',
		required: true,
		nullable: false,
	})
	boardId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the card.',
		required: true,
		nullable: false,
	})
	cardId!: string;
}
