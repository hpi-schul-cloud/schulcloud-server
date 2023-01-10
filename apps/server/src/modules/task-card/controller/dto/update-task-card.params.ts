import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsString, MinLength, ValidateNested } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';
import { CardElementType, InputFormat } from '@shared/domain';
import { Type } from 'class-transformer';

export abstract class CardElementBase {}

export class TitleCardElementParam extends CardElementBase {
	@ApiProperty({ description: 'type of element, needed for discriminator' })
	type = CardElementType.Title;

	@ApiProperty({
		description: 'Title of the card',
		required: true,
	})
	@IsString()
	@MinLength(2)
	@SanitizeHtml()
	value!: string;
}

export class RichTextCardElementParam extends CardElementBase {
	@ApiProperty({ description: 'type of element, needed for discriminator' })
	type = CardElementType.RichText;

	@ApiProperty({
		description: 'Content of the rich text element',
		required: true,
	})
	@MinLength(2)
	@IsString()
	value!: string;

	@ApiProperty({ description: 'Input format', enum: InputFormat })
	@IsEnum(InputFormat)
	inputFormat!: InputFormat;
}

@ApiExtraModels(TitleCardElementParam, RichTextCardElementParam)
export class CardElementUpdateParams {
	@ApiProperty()
	@IsString()
	@IsMongoId()
	id?: string;

	@ApiProperty({
		description: 'Content of the element, depending on its type',
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

export class UpdateTaskCardParams {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CardElementUpdateParams)
	@ApiProperty({
		description: 'Card elements array',
		type: [CardElementUpdateParams],
	})
	cardElements!: CardElementUpdateParams[];
}
