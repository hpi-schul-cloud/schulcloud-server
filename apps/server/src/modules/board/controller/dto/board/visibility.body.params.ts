import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VisibilityBodyParams {
	@IsBoolean()
	@ApiProperty({
		required: true,
		type: 'boolean',
	})
	isVisible!: boolean;
}
