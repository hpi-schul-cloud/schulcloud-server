import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PutMyPasswordParams {
	@IsString()
	@ApiProperty({
		description: 'Updates the user password.',
		required: true,
		nullable: false,
	})
	password!: string;

	@IsString()
	@ApiProperty({
		description: 'Updates the user password.',
		required: true,
		nullable: false,
	})
	confirmPassword!: string;
}
