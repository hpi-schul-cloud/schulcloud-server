import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';
import { IsEnum } from 'class-validator';

export class ChangeLanguageParams {
	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	@IsEnum(LanguageType)
	language!: LanguageType;
}
