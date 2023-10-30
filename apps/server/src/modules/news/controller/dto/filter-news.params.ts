import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller/transformer/string-to-boolean.transformer';
import { NewsTargetModel } from '@shared/domain/types/news.types';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class FilterNewsParams {
	@IsOptional()
	@IsString()
	@IsEnum(NewsTargetModel)
	@ApiPropertyOptional({
		enum: NewsTargetModel,
		description: 'Target model to which the news are related',
	})
	targetModel?: string;

	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: '[a-f0-9]{24}',
		description: 'Specific target id to which the news are related (works only together with targetModel)',
	})
	targetId?: string;

	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({
		description: 'Flag that filters if the news should be published or not',
	})
	unpublished?: boolean;
}
