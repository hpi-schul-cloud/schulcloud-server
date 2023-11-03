import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SchoolYearQueryType } from '../interface';

export class FilterParams {
	@IsOptional()
	@IsEnum(SchoolYearQueryType)
	@ApiPropertyOptional({ enum: SchoolYearQueryType })
	type?: SchoolYearQueryType;
}
