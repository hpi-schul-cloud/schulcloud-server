import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum SortOrder {
	asc = 'asc',
	desc = 'desc',
}

export abstract class SortingParams<T> {
	/**
	 * Set type and Decorators in extending classes
	 */
	abstract sortBy?: T;

	@IsOptional()
	@IsEnum(SortOrder)
	@ApiPropertyOptional({ enum: SortOrder })
	sortOrder: SortOrder = SortOrder.asc;
}
