import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ToBoolean } from '@shared/transformer';

// TODO validate
export class NewsFilterQuery {
	@IsString()
	@IsOptional()
	@IsIn(['schools', 'courses', 'teams'])
	@ApiProperty()
	targetModel?: string;

	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	targetId?: string;

	@IsOptional()
	@IsBoolean()
	@ToBoolean()
	@ApiProperty()
	unpublished?: boolean;
}
