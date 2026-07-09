import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SchoolYearQueryType } from '../interface';

export class ClassFilterParams {
	@IsOptional()
	@IsEnum(SchoolYearQueryType)
	@ApiPropertyOptional({ enum: SchoolYearQueryType, enumName: 'SchoolYearQueryType' })
	type?: SchoolYearQueryType;
}
