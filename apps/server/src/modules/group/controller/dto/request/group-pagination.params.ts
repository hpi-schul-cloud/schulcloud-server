import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { IsInt } from 'class-validator';

export class GroupPaginationParams extends PaginationParams {
	@IsInt()
	@ApiPropertyOptional({ description: 'Page limit, defaults to 10.' })
	override limit?: number = 10;
}
