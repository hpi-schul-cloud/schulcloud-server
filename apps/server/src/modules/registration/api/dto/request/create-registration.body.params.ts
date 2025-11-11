import { Consent, RegistrationCreateProps } from '../../../domain';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsString } from 'class-validator';

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

	@IsArray()
	@IsEnum(Consent, { each: true })
	@ApiProperty({
		name: 'consent',
		description: 'The consent given by the user.',
		required: true,
		isArray: true,
		nullable: false,
		enum: Consent,
		enumName: 'Consent',
	})
	public consent!: Consent[];

	@IsEnum(LanguageType)
	@ApiProperty({
		description: 'The chosen language for the registration process.',
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	public language!: LanguageType;

	@IsArray()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The IDs of rooms the user is invited to.',
		required: true,
	})
	public roomIds!: string[];
}
