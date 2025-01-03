import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect, SanitizeHtml } from '@shared/controller';
import { IsBoolean, IsString, IsOptional, Matches, IsEmail } from 'class-validator';
import { passwordPattern } from '../../../domain/password-pattern';

export class AccountByIdBodyParams {
	@IsOptional()
	@IsString()
	@SanitizeHtml()
	@IsEmail()
	@ApiProperty({
		description: 'The new user name for the user.',
		required: false,
		nullable: true,
	})
	public username?: string;

	@PrivacyProtect()
	@IsOptional()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new password for the user.',
		required: false,
		nullable: true,
	})
	public password?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({
		description: 'The new activation state of the user.',
		required: false,
		nullable: true,
	})
	public activated?: boolean;
}
