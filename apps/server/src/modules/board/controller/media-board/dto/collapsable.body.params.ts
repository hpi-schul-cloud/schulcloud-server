import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CollapsableBodyParams {
	@IsBoolean()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	collapsed!: boolean;
}
