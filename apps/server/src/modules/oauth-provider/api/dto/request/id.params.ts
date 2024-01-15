import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class IdParams {
	@IsString()
	@ApiProperty({
		description: 'The Oauth Client Id.',
		required: true,
		nullable: false,
	})
	id!: string;
}
