import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ToBoolean } from '@shared/transformer';

// TODO validate
export class NewsFilterQuery {
	@IsString()
	@IsOptional()
	@ApiProperty()
	targetModel?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	targetId?: string;

	@IsOptional()
	@IsBoolean()
	@ToBoolean()
	@ApiProperty()
	unpublished?: boolean;
}
