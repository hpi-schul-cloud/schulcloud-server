import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for patching a new email of an user
 */

export class PatchEmailParams {
	@IsString()
	@ApiProperty({
		description: 'Email of the user',
	})
	email!: string;
}
