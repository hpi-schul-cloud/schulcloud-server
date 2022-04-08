import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain';
import { IsEnum } from 'class-validator';

export class ChangeLanguageParams {
	@ApiProperty({ enum: LanguageType })
	@IsEnum(LanguageType)
	language!: LanguageType;
}
