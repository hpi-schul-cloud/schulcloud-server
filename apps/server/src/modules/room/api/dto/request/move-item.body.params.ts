import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveItemBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	id!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toPosition!: number;
}
