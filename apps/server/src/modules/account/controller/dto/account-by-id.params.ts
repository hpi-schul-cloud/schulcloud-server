import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccountByIdParams {
	@IsString()
	@ApiProperty({
		description: 'The id for the account.',
		// TODO: these are the default values, and can be removed
		required: true,
		nullable: false,
	})
	id!: string;
}
