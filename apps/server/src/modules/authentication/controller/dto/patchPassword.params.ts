import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for patching a new password of an user
 */

export class PatchPasswordParams {
	@IsString()
	@ApiProperty({
		description: 'Password of the user',
	})
	passwordNew!: string;

	passwordOld!: string;
}
