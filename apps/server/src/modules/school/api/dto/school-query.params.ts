import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { EntityId } from '@shared/domain/types/entity-id';
import { IsInt, IsMongoId, IsOptional } from 'class-validator';

export class SchoolQueryParams extends PaginationParams {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	federalStateId?: EntityId;

	@IsInt()
	@ApiPropertyOptional({ description: 'Page limit.' })
	override limit?: number;
}
