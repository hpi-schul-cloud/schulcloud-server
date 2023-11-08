import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class DeletionExecutionParams {
	@IsInt()
	@Min(0)
	@ApiPropertyOptional({ description: 'Page limit, defaults to 100.', minimum: 0 })
	limit?: number = 100;
}
