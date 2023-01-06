import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ShareTokenUrlParams {
	@IsString()
	@ApiProperty({
		description: 'The token that identifies the shared object',
		required: true,
		nullable: false,
	})
	token!: string;
}
