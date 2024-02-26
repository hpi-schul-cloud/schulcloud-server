import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect, SanitizeHtml } from '@shared/controller';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class PatchMyAccountParams {
	@IsString()
	@ApiProperty({
		description: 'The current user password to authorize the update action.',
		// TODO: can be removed
		required: true,
		nullable: false,
	})
	passwordOld!: string;

	@PrivacyProtect()
	@IsString()
	@IsOptional()
	@Matches(passwordPattern)
	// TODO: ApiPropertyOptional
	@ApiProperty({
		description: 'The new password for the current user.',
		required: false,
		nullable: true,
	})
	passwordNew?: string;

	@IsEmail()
	// TODO: please add tests to ensure sanitisation
	@SanitizeHtml()
	@IsOptional()
	// TODO: ApiPropertyOptional
	@ApiProperty({
		description: 'The new email address for the current user.',
		required: false,
		nullable: true,
	})
	email?: string;

	@IsString()
	@SanitizeHtml()
	@IsOptional()
	// TODO: ApiPropertyOptional
	@ApiProperty({
		description: 'The new first name for the current user.',
		required: false,
		nullable: true,
	})
	firstName?: string;

	@IsString()
	@SanitizeHtml()
	@IsOptional()
	// TODO: ApiPropertyOptional
	@ApiProperty({
		description: 'The new last name for the current user.',
		required: false,
		nullable: true,
	})
	lastName?: string;
}
