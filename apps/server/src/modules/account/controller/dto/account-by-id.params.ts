import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccountByIdParams {
	@IsString()
	@ApiProperty({
		description: 'The id for the account.',
		required: true,
		nullable: false,
	})
	id!: string;
}
