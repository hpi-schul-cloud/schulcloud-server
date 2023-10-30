import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller/dto/sorting.params';
import { IsEnum, IsOptional } from 'class-validator';

export enum ExternalToolSortBy {
	ID = 'id',
	NAME = 'name',
}

export class SortExternalToolParams extends SortingParams<ExternalToolSortBy> {
	@IsOptional()
	@IsEnum(ExternalToolSortBy)
	@ApiPropertyOptional({ enum: ExternalToolSortBy })
	sortBy?: ExternalToolSortBy;
}
