import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ContentElementType, InputFormat } from '@shared/domain';
import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';

export abstract class ElementContentBody {
	@ApiProperty({
		enum: ContentElementType,
		description: 'the type of the updated element',
	})
	@IsEnum(ContentElementType)
	type!: ContentElementType;
}

export class RichTextContentBody {
	@IsString()
	@ApiProperty()
	text!: string;

	@IsEnum(InputFormat)
	@ApiProperty()
	inputFormat!: InputFormat;
}

export class FileContentBody {
	@IsString()
	@ApiProperty({})
	caption!: string;
}

export class RichTextElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.RICH_TEXT })
	type!: ContentElementType.RICH_TEXT;

	@ValidateNested()
	@ApiProperty()
	content!: RichTextContentBody;
}

export class FileElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.FILE })
	type!: ContentElementType.FILE;

	@ValidateNested()
	@ApiProperty()
	content!: FileContentBody;
}

export type AnyElementContentBody = RichTextElementContentBody | FileContentBody;

export class ElementContentUpdateBodyParams {
	@ValidateNested()
	@Type(() => ElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: RichTextElementContentBody, name: ContentElementType.RICH_TEXT },
				{ value: FileElementContentBody, name: ContentElementType.FILE },
			],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [{ $ref: getSchemaPath(RichTextElementContentBody) }, { $ref: getSchemaPath(FileElementContentBody) }],
	})
	data!: RichTextElementContentBody | FileElementContentBody;
}
