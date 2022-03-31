import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class AccountByIdBody {
	@IsString()
	@ApiProperty({
		description: 'The new user name for the user.',
		required: true,
		nullable: false,
	})
	username!: string;

	@IsString()
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
