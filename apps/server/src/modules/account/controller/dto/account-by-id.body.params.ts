import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, Matches, IsEmail } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class AccountByIdBodyParams {
	@IsOptional()
	@IsString()
	@IsEmail()
	@ApiProperty({
		description: 'The new user name for the user.',
		required: false,
		nullable: true,
	})
	username?: string;

	@IsOptional()
	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new password for the user.',
		required: false,
		nullable: true,
	})
	password?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({
		description: 'The new activation state of the user.',
		required: false,
		nullable: true,
	})
	activated?: boolean;
}
