import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';

export enum ClassSortBy {
	NAME = 'name',
	EXTERNAL_SOURCE_NAME = 'externalSourceName',
}

export class ClassSortParams extends SortingParams<ClassSortBy> {
	@IsOptional()
	@IsEnum(ClassSortBy)
	@ApiPropertyOptional({ enum: ClassSortBy })
	sortBy?: ClassSortBy;
}
