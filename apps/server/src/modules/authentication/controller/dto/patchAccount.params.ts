import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for patching a new email and password of an user
 */

export class PatchAccountParams {
	@IsString()
	@ApiProperty({
		description: 'Email and Password of the user',
	})
	email!: string;

	passwordNew!: string;

	passwordOld!: string;
}
