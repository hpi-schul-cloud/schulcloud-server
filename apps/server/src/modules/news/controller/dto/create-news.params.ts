import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NewsTargetModel } from '@shared/domain';
import { SanitizeHtml } from '@shared/controller';

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
	@SanitizeHtml({ keep: 'richtext' })
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
		pattern: '[a-f0-9]{24}',
		description: 'Specific target id to which the News entity is related',
	})
	targetId!: string;
}
