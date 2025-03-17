import { ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../../domain';

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
