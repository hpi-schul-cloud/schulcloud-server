import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyProtect, SanitizeHtml } from '@shared/controller';
import { IsBoolean, IsString, IsOptional, Matches, IsEmail } from 'class-validator';
import { passwordPattern } from '../../../domain/password-pattern';

export class AccountByIdBodyParams {
	@IsOptional()
	@IsString()
	@SanitizeHtml()
	@IsEmail()
	@ApiPropertyOptional({
		description: 'The new user name for the user.',
	})
	public username?: string;

	@PrivacyProtect()
	@IsOptional()
	@IsString()
	@Matches(passwordPattern)
	@ApiPropertyOptional({
		description: 'The new password for the user.',
	})
	public password?: string;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({
		description: 'The new activation state of the user.',
	})
	public activated?: boolean;
}
