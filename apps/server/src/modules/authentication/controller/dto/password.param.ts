import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class Password {
	@ApiProperty({
		description: 'New password of the user',
	})
	@IsString()
	password!: string;
}
