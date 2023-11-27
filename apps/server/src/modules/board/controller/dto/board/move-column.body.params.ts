import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveColumnBodyParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the target board',
		required: true,
		nullable: false,
	})
	toBoardId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toPosition!: number;
}
