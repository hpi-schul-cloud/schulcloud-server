import { RegistrationCreateProps } from '../../../domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsString } from 'class-validator';

export class CreateRegistrationBodyParams implements RegistrationCreateProps {
	@IsEmail()
	@ApiProperty({
		description: 'The mail adress of the new user. Will also be used as username.',
		required: true,
		nullable: false,
	})
	public email!: string;

	@IsString()
	@ApiProperty({
		description: 'The firstname of the new user.',
		required: true,
		nullable: false,
	})
	public firstName!: string;

	@IsString()
	@ApiProperty({
		description: 'The lastname of the new user.',
		required: true,
		nullable: false,
	})
	public lastName!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the room the user is invited to.',
		required: true,
		nullable: false,
	})
	public roomId!: string;
}
