import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { ClassSortBy } from '../interface';

export class ClassSortParams extends SortingParams<ClassSortBy> {
	@IsOptional()
	@IsEnum(ClassSortBy)
	@ApiPropertyOptional({ enum: ClassSortBy, enumName: 'ClassSortBy' })
	sortBy?: ClassSortBy;
}
