import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PutMyPasswordParams {
	@IsString()
	@ApiProperty({
		description: 'The new user password.',
		required: true,
		nullable: false,
	})
	password!: string;

	@IsString()
	@ApiProperty({
		description: 'The confirmed new user password. Must match the password field.',
		required: true,
		nullable: false,
	})
	confirmPassword!: string;
}
