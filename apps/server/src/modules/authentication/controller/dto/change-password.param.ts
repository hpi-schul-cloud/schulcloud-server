import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../interface/password-pattern';

export class ChangePasswordParam {
	@ApiProperty({
		description: 'New password of the user',
	})
	@IsString()
	@IsNotEmpty()
	@Matches(passwordPattern)
	password!: string;
}
