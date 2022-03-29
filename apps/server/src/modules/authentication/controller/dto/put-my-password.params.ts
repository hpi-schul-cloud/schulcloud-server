import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { passwordPattern } from './password-pattern';

export class PutMyPasswordParams {
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new user password.',
		required: true,
		nullable: false,
	})
	password!: string;

	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The confirmed new user password. Must match the password field.',
		required: true,
		nullable: false,
	})
	confirmPassword!: string;
}
