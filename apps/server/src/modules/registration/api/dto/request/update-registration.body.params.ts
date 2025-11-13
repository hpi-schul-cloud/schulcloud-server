import { passwordPattern } from '../../../domain/do';
import { Consent, RegistrationUpdateProps } from '../../../domain';
import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { LanguageType } from '@shared/domain/interface';
import { IsArray, IsEnum, IsMongoId, IsString, Matches } from 'class-validator';

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
	public consent!: Consent[];

	@IsEnum(LanguageType)
	@ApiProperty({
		description: 'The chosen language for the registration process.',
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	public language!: LanguageType;

	@IsString()
	@PrivacyProtect()
	@Matches(passwordPattern)
	@ApiProperty({
		description: 'The chosen password for the registration process.',
		required: true,
	})
	public password!: string;

	@IsArray()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The IDs of rooms the user is invited to.',
		required: true,
	})
	public roomIds!: string[];
}
