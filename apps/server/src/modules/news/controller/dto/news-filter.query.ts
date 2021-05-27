import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ToBoolean } from '../../../../shared/transformer';

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

	@IsOptional()
	@IsBoolean()
	@ToBoolean()
	@ApiProperty()
	unpublished?: boolean;
}
