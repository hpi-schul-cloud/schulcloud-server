import { Consent, RegistrationCreateProps, RegistrationUpdateProps } from '@modules/registration/domain';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsString } from 'class-validator';

export class UpdateRegistrationBodyParams implements RegistrationUpdateProps {
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
	consent!: Consent[];

	@IsEnum(LanguageType)
	@ApiProperty({
		description: 'The chosen language for the registration process.',
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	language!: LanguageType;

	@IsString()
	@ApiProperty({
		description: 'The chosen password for the registration process.',
		required: true,
	})
	password!: string;

	@IsString()
	@ApiProperty({
		description: 'The given pin for the registration process.',
		required: true,
	})
	pin!: string;

	@IsArray()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The IDs of rooms the user is invited to.',
		required: true,
	})
	roomIds!: string[];
}
