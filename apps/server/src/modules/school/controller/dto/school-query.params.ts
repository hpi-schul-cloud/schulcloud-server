import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { IsMongoId, IsOptional } from 'class-validator';

export class SchoolQueryParams {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	federalStateId?: EntityId;
}
