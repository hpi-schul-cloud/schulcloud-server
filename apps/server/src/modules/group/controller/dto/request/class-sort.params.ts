import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller/dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ClassSortQueryType } from '../interface';

export class ClassSortParams extends SortingParams<ClassSortQueryType> {
	@IsOptional()
	@IsEnum(ClassSortQueryType)
	@ApiPropertyOptional({ enum: ClassSortQueryType, enumName: 'ClassSortQueryType' })
	sortBy?: ClassSortQueryType;
}
