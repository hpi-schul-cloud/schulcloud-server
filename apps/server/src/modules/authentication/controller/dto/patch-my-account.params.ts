import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class PatchMyAccountParams {
	@IsString()
	@ApiProperty({
		description: 'The current user password to authorize the update action.',
		required: true,
		nullable: false,
	})
	passwordOld!: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The new password for the current user.',
		required: false,
		nullable: true,
	})
	passwordNew?: string;

	@IsEmail()
	@IsOptional()
	@ApiProperty({
		description: 'The new email address for the current user.',
		required: false,
		nullable: true,
	})
	email?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The new first name for the current user.',
		required: false,
		nullable: true,
	})
	firstName?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The new last name for the current user.',
		required: false,
		nullable: true,
	})
	lastName?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The new preferred language for the current user.',
		required: false,
		nullable: true,
	})
	language?: string;
}
