import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ToBoolean } from '@shared/transformer';
import { NewsTargetModel } from '../../entity';

const TARGET_MODEL_VALUES = Object.values(NewsTargetModel);

export class NewsFilterQuery {
	@IsOptional()
	@IsString()
	@IsIn(TARGET_MODEL_VALUES)
	@ApiPropertyOptional({
		enum: TARGET_MODEL_VALUES,
		enumName: 'NewsTargetModel',
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
	@ToBoolean()
	@ApiPropertyOptional({
		description: 'Flag that filters if the news should be published or not',
	})
	unpublished?: boolean;
}
