import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveElementBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toLineId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toPosition!: number;
}
