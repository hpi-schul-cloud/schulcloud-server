import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { CardElementType, InputFormat } from '@shared/domain';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDate,
	IsEnum,
	IsMongoId,
	IsOptional,
	IsString,
	MaxLength,
	MinDate,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { isObject } from 'lodash';

export abstract class CardElementBase {}

export class RichTextCardElementParam extends CardElementBase {
	@ApiProperty({
		description: 'Type of card element, i.e. richText (needed for discriminator)',
		type: String,
		example: CardElementType.RichText,
	})
	type = CardElementType.RichText;

	@ApiProperty({
		description: 'Content of the rich text card element',
		required: true,
	})
	@IsString()
	value!: string;

	@ApiProperty({ description: 'Input format of card element content', enum: InputFormat })
	@IsEnum(InputFormat)
	inputFormat!: InputFormat;
}

@ApiExtraModels(RichTextCardElementParam)
export class CardElementParams {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsMongoId()
	id?: string;

	@ApiProperty({
		description: 'Content of the card element, depending on its type',
		required: true,
		oneOf: [{ $ref: getSchemaPath(RichTextCardElementParam) }],
	})
	@ValidateNested()
	@Type(() => CardElementBase, {
		discriminator: {
			property: 'type',
			subTypes: [{ value: RichTextCardElementParam, name: CardElementType.RichText }],
		},
	})
	content!: RichTextCardElementParam;
}

export class TaskCardParams {
	@IsString()
	@IsMongoId()
	@ApiProperty({
		description: 'The id of an course object.',
		pattern: '[a-f0-9]{24}',
	})
	courseId!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(400)
	@SanitizeHtml()
	@ApiProperty({
		description: 'The title of the card',
	})
	title!: string;

	@IsOptional()
	@IsDate()
	@MinDate(new Date())
	@ApiPropertyOptional({ description: 'Visible at date of the card' })
	visibleAtDate?: Date;

	@IsDate()
	@MinDate(new Date())
	@ApiProperty({ description: 'Due date of the card' })
	dueDate!: Date;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@ApiPropertyOptional({ description: 'Array of student ids that this task is assigned to' })
	assignedUsers?: string[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CardElementParams)
	@ApiPropertyOptional({
		description: 'Card elements array',
		type: [CardElementParams],
	})
	cardElements?: CardElementParams[];
}
