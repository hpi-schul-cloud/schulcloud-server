import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller';
import { IsString, Matches } from 'class-validator';
import { passwordPattern } from '../password-pattern';

export class PatchMyPasswordParams {
	@PrivacyProtect()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new user password.',
		required: true,
		nullable: false,
	})
	password!: string;

	@PrivacyProtect()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The confirmed new user password. Must match the password field.',
		required: true,
		nullable: false,
	})
	confirmPassword!: string;
}
