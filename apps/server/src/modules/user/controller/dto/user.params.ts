import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/entity';
import { IsEnum } from 'class-validator';

export class ChangeLanguageParams {
	@ApiProperty({ enum: LanguageType })
	@IsEnum(LanguageType)
	language!: LanguageType;
}
