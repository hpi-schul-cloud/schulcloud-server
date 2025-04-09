import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { SanitizeHtml } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NewsTargetModel } from '../../domain';

/**
 * DTO for creating a news document.
 */
export class CreateNewsParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the News entity',
	})
	title!: string;

	@IsString()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
	@ApiProperty({
		description: 'Content of the News entity',
	})
	content!: string;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({
		description:
			'The point in time from when the News entity schould be displayed. Defaults to now so that the news is published',
	})
	displayAt?: Date;

	@IsEnum(NewsTargetModel)
	@ApiProperty({
		enum: NewsTargetModel,
		description: 'Target model to which the News entity is related',
	})
	targetModel!: string;

	@IsMongoId()
	@ApiProperty({
		pattern: bsonStringPattern,
		description: 'Specific target id to which the News entity is related',
	})
	targetId!: string;
}
