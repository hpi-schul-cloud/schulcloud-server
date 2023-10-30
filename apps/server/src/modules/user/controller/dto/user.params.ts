import { ApiProperty } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/entity/user.entity';

import { IsEnum } from 'class-validator';

export class ChangeLanguageParams {
	@ApiProperty({ enum: LanguageType })
	@IsEnum(LanguageType)
	language!: LanguageType;
}
