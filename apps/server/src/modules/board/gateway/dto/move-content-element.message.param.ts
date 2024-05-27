import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveContentElementMessageParams {
	@IsMongoId()
	elementId!: string;

	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toCardId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toPosition!: number;
}
