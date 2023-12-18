import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PaginationParams {
	@IsInt()
	@Min(0)
	@ApiPropertyOptional({ description: 'Number of elements (not pages) to be skipped' })
	skip?: number = 0;

	@IsInt()
	@ApiPropertyOptional({ description: 'Page limit, defaults to 10.' })
	limit?: number = 10;
}
