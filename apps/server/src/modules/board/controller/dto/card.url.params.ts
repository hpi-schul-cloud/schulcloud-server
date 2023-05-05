import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CardUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the card.',
		required: true,
		nullable: false,
	})
	cardId!: string;
}
