import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class AccountByIdBodyParams {
	@IsString()
	@ApiProperty({
		description: 'The new user name for the user.',
		required: true,
		nullable: false,
	})
	username!: string;

	@IsString()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The new password for the user.',
		required: true,
		nullable: false,
	})
	password!: string;

	@IsBoolean()
	@ApiProperty({
		description: 'The new activation state of the user.',
		required: true,
		nullable: false,
	})
	activated!: boolean;
}
