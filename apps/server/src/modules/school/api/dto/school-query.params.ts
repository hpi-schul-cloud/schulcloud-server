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
	@IsOptional()
	@ApiPropertyOptional({ description: 'Page limit.' })
	override limit?: number = 1000000;

	@IsInt()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Schools to skip from the beginning (for pagination)' })
	override skip?: number;
}
