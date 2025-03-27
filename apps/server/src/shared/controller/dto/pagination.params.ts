import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationParams {
	@IsInt()
	@IsOptional()
	@Min(0)
	@ApiPropertyOptional({ description: 'Number of elements (not pages) to be skipped' })
	public skip?: number = 0;

	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(100)
	@ApiPropertyOptional({ description: 'Page limit, defaults to 10.', minimum: 1, maximum: 99 })
	public limit?: number = 10;
}
