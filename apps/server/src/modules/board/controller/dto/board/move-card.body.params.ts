import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveCardBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toColumnId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toPosition!: number;
}
