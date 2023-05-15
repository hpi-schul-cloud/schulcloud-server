import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';

export abstract class ElementContentBody {
	@ApiProperty({
		enum: ContentElementType,
		description: 'the type of the updated element',
		enumName: 'ContentElementType',
	})
	@IsEnum(ContentElementType)
	type!: ContentElementType;
}

export class TextContentBody {
	@IsString()
	@ApiProperty()
	text!: string;
}

export class FileContentBody {
	@IsString()
	@ApiProperty({})
	caption!: string;
}

export class TextElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.TEXT })
	type!: ContentElementType.TEXT;

	@ValidateNested()
	@ApiProperty()
	content!: TextContentBody;
}

export class FileElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.FILE })
	type!: ContentElementType.FILE;

	@ValidateNested()
	@ApiProperty()
	content!: FileContentBody;
}

export type AnyElementContentBody = TextContentBody | FileContentBody;

export class ElementContentUpdateBodyParams {
	@ValidateNested()
	@Type(() => ElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: TextElementContentBody, name: ContentElementType.TEXT },
				{ value: FileElementContentBody, name: ContentElementType.FILE },
			],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [{ $ref: getSchemaPath(TextElementContentBody) }, { $ref: getSchemaPath(FileElementContentBody) }],
	})
	data!: TextElementContentBody | FileElementContentBody;
}
