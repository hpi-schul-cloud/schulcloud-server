import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SchoolYearQueryType } from '../interface';

export class ClassFilterParams {
	@IsOptional()
	@IsEnum(SchoolYearQueryType)
	@ApiPropertyOptional({ enum: SchoolYearQueryType, enumName: 'SchoolYearQueryType' })
	type?: SchoolYearQueryType;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({ default: false })
	loadUsers?: boolean;
}
