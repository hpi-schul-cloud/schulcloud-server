import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CompleteRegistrationBodyParams {
	@ApiProperty({
		description: 'The prefered language of the new user.',
		required: true,
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	@IsEnum(LanguageType)
	public language!: LanguageType;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	public password!: string;
}
