import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
