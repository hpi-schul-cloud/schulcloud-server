import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AddByEmailBodyParams {
	@IsEmail()
	@ApiProperty({
		description: 'The email of external person to add to the room',
		required: true,
		nullable: false,
	})
	public email!: string;
}
