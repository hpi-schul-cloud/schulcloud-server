import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum SchoolYearQueryType {
	NEXT_YEAR = 'nextYear',
	CURRENT_YEAR = 'currentYear',
	PREVIOUS_YEARS = 'previousYears',
}

export class ClassFilterParams {
	@IsOptional()
	@IsEnum(SchoolYearQueryType)
	@ApiPropertyOptional()
	type?: SchoolYearQueryType;
}
