import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CollapsableBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	collapsable!: boolean;
}
