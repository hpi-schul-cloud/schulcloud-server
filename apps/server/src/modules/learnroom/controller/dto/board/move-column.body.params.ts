import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveColumnBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	columnId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toIndex!: number;
}
