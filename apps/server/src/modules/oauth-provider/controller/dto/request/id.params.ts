import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdParams {
	@IsString()
	@ApiProperty({
		description: 'The Oauth Client Id.',
		required: true,
		nullable: false,
	})
	id!: string;
}
