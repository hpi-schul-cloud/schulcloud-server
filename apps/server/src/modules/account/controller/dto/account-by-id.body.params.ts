import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect, SanitizeHtml } from '@shared/controller';
import { IsBoolean, IsString, IsOptional, Matches, IsEmail } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class AccountByIdBodyParams {
	@IsOptional()
	@IsString()
	@SanitizeHtml()
	@IsEmail()
	/* TODO: @ApiPropertyOptional({
		description: 'The new user name for the user.',
	}) */
	@ApiProperty({
		description: 'The new user name for the user.',
		required: false,
		nullable: true,
	})
	username?: string;

	@PrivacyProtect()
	@IsOptional()
	@IsString()
	@Matches(passwordPattern)
	// TODO: use ApiPropertyOptional instead
	@ApiProperty({
		description: 'The new password for the user.',
		required: false,
		nullable: true,
	})
	password?: string;

	@IsOptional()
	@IsBoolean()
	// TODO: use ApiPropertyOptional instead
	@ApiProperty({
		description: 'The new activation state of the user.',
		required: false,
		nullable: true,
	})
	activated?: boolean;
}
