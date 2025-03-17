import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../../domain';

export class PatchMyPasswordParams {
	@PrivacyProtect()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new user password.',
		required: true,
		nullable: false,
	})
	public password!: string;

	@PrivacyProtect()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The confirmed new user password. Must match the password field.',
		required: true,
		nullable: false,
	})
	public confirmPassword!: string;
}
