import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { EntityId } from '@shared/domain/types/entity-id';
import { IsInt, IsMongoId, IsOptional } from 'class-validator';

export class SchoolQueryParams extends PaginationParams {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	public federalStateId?: EntityId;

	@IsInt()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Page limit.' })
	public override limit?: number | undefined = undefined;

	@IsInt()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Schools to skip from the beginning (for pagination)' })
	public override skip?: number;
}
