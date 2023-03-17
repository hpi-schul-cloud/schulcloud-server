import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class MoveColumnBodyParams {
	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toIndex!: number;
}
