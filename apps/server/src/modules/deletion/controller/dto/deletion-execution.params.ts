import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DeletionExecutionParams {
	@IsInt()
	@Min(1)
	@IsOptional()
	@ApiPropertyOptional({ description: 'Page limit, defaults to 100.', minimum: 1 })
	limit?: number = 100;
}
