import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccountByIdParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id for the account as MongoDB id.',
		required: true,
		nullable: false,
	})
	id!: string;
}
