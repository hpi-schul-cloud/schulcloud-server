import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AccountByIdParams {
	@IsString()
	@ApiProperty({
		description: 'The id for the account.',
		required: true,
		nullable: false,
	})
	id!: string;
}
