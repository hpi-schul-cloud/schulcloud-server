import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ContentElementType, InputFormat } from '@shared/domain';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsString, ValidateNested } from 'class-validator';

export abstract class ElementContentBody {
	@ApiProperty({
		enum: ContentElementType,
		description: 'the type of the updated element',
		enumName: 'ContentElementType',
	})
	@IsEnum(ContentElementType)
	type!: ContentElementType;
}

export class FileContentBody {
	@IsString()
	@ApiProperty({})
	caption!: string;
}

export class FileElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.FILE })
	type!: ContentElementType.FILE;

	@ValidateNested()
	@ApiProperty()
	content!: FileContentBody;
}

export class RichTextContentBody {
	@IsString()
	@ApiProperty()
	text!: string;

	@IsEnum(InputFormat)
	@ApiProperty()
	inputFormat!: InputFormat;
}

export class RichTextElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.RICH_TEXT })
	type!: ContentElementType.RICH_TEXT;

	@ValidateNested()
	@ApiProperty()
	content!: RichTextContentBody;
}

export class SubmissionContainerContentBody {
	@IsDate()
	@ApiProperty()
	dueDate!: Date;
}

export class TaskElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.SUBMISSION_CONTAINER })
	type!: ContentElementType.SUBMISSION_CONTAINER;

	@ValidateNested()
	@ApiProperty()
	content!: SubmissionContainerContentBody;
}

export type AnyElementContentBody = RichTextElementContentBody | FileContentBody;

export class ElementContentUpdateBodyParams {
	@ValidateNested()
	@Type(() => ElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: FileElementContentBody, name: ContentElementType.FILE },
				{ value: RichTextElementContentBody, name: ContentElementType.RICH_TEXT },
				{ value: TaskElementContentBody, name: ContentElementType.SUBMISSION_CONTAINER },
			],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(FileElementContentBody) },
			{ $ref: getSchemaPath(RichTextElementContentBody) },
			{ $ref: getSchemaPath(TaskElementContentBody) },
		],
	})
	data!: FileElementContentBody | RichTextElementContentBody | TaskElementContentBody;
}
