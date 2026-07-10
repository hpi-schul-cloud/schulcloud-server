import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../../domain';

export class PatchMyAccountParams {
	@IsString()
	@ApiProperty({
		description: 'The current user password to authorize the update action.',
		required: true,
		nullable: false,
	})
	passwordOld!: string;

	@PrivacyProtect()
	@IsString()
	@IsOptional()
	@Matches(passwordPattern)
	@ApiPropertyOptional({
		description: 'The new password for the current user.',
	})
	passwordNew?: string;

	@IsEmail()
	@SanitizeHtml()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The new email address for the current user.',
	})
	email?: string;

	@IsString()
	@SanitizeHtml()
	@IsOptional()
	@SanitizeHtml()
	@ApiPropertyOptional({
		description: 'The new first name for the current user.',
	})
	firstName?: string;

	@IsString()
	@SanitizeHtml()
	@IsOptional()
	@SanitizeHtml()
	@ApiPropertyOptional({
		description: 'The new last name for the current user.',
	})
	lastName?: string;
}
