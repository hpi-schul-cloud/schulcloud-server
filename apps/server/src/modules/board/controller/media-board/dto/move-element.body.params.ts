import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveElementBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
		description: 'The id of the line where the element is moved to',
	})
	toLineId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
		description: 'The position where the element is moved to',
	})
	toPosition!: number;
}
