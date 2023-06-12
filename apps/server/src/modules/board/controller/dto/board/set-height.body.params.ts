import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';

export class SetHeightBodyParams {
	@IsPositive()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	height!: number;
}
