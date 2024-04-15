import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ElementUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the element.',
		required: true,
		nullable: false,
	})
	elementId!: string;
}
