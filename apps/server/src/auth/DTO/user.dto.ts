import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserDTO {
	@ApiProperty({ description: 'username of a user', example: 'john' })
	username: string;

	@ApiProperty({ description: 'password of a user', example: 'changeme' })
	password: string;
}
