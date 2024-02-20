import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserByIdParams {
	@IsString()
	@ApiProperty({
		description: 'The id of the user.',
		required: true,
		nullable: false,
	})
	id!: string;
}
