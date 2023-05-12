import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ExternalToolSortOrder {
	ID = 'id',
	NAME = 'name',
}

export class SortExternalToolParams extends SortingParams<ExternalToolSortOrder> {
	@IsOptional()
	@IsEnum(ExternalToolSortOrder)
	@ApiPropertyOptional({ enum: ExternalToolSortOrder })
	sortBy?: ExternalToolSortOrder;
}
