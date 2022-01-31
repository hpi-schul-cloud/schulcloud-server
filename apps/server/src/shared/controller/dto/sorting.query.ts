import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum SortOrder {
	asc = 'asc',
	desc = 'desc',
}

export class SortingQuery {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ type: String })
	sortBy?: string;

	@IsOptional()
	@IsEnum(SortOrder)
	@ApiPropertyOptional({ enum: SortOrder })
	sortOrder: SortOrder = SortOrder.asc;
}
