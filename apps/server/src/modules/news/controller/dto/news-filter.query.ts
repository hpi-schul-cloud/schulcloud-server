import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

// TODO validate
export class NewsFilterQuery {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	targetModel?: string;

	@IsString()
	@IsOptional()
	@ApiProperty()
	targetId?: string;

	@IsBoolean()
	@IsOptional()
	@ApiProperty()
	unpublished?: boolean;
}
