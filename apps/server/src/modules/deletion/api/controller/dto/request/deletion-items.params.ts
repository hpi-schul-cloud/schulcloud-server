import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class DeletionItemsParams {
	@IsInt()
	@Min(1)
	@IsOptional()
	@ApiPropertyOptional({ description: 'Page limit, defaults to 100.', minimum: 1 })
	limit?: number;

	@IsBoolean()
	@IsOptional()
	runFailed?: boolean = false;
}
