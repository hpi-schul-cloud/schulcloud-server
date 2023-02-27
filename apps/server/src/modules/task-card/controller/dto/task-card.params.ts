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
	MinDate,
	MinLength,
	ValidateNested,
} from 'class-validator';

export abstract class CardElementBase {}

export class TitleCardElementParam extends CardElementBase {
	@ApiProperty({
		description: 'Type of card element, i.e. text (needed for discriminator)',
		type: String,
		example: CardElementType.Title,
	})
	type = CardElementType.Title;

	@ApiProperty({
		description: 'Title of the card, content of title card element',
		required: true,
	})
	@IsString()
	@MinLength(2)
	@SanitizeHtml()
	value!: string;
}

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
	@MinLength(2)
	@IsString()
	value!: string;

	@ApiProperty({ description: 'Input format of card element content', enum: InputFormat })
	@IsEnum(InputFormat)
	inputFormat!: InputFormat;
}

@ApiExtraModels(TitleCardElementParam, RichTextCardElementParam)
export class CardElementParams {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsMongoId()
	id?: string;

	@ApiProperty({
		description: 'Content of the card element, depending on its type',
		required: true,
		oneOf: [{ $ref: getSchemaPath(TitleCardElementParam) }, { $ref: getSchemaPath(RichTextCardElementParam) }],
	})
	@ValidateNested()
	@Type(() => CardElementBase, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: TitleCardElementParam, name: CardElementType.Title },
				{ value: RichTextCardElementParam, name: CardElementType.RichText },
			],
		},
	})
	content!: RichTextCardElementParam | TitleCardElementParam;
}

export class TaskCardParams {
	@IsString()
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The id of an course object.',
		pattern: '[a-f0-9]{24}',
	})
	courseId?: string;

	@IsOptional()
	@IsDate()
	@MinDate(new Date())
	@ApiPropertyOptional({ description: 'Visible at date of the card' })
	visibleAtDate?: Date;

	@IsOptional()
	@IsDate()
	@MinDate(new Date())
	@ApiPropertyOptional({ description: 'Due date of the card' })
	dueDate?: Date;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CardElementParams)
	@ApiProperty({
		description: 'Card elements array',
		type: [CardElementParams],
	})
	cardElements!: CardElementParams[];
}
