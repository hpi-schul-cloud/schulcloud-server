import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class ChangePasswordParams {
	@ApiProperty({
		description: 'New password of the user',
	})
	@IsString()
	@IsNotEmpty()
	@Matches(passwordPattern)
	password!: string;
}
