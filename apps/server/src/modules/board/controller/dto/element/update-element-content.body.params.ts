import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentElementType } from '../../../domain/types';

export abstract class ElementContentBody {
	@IsEnum(ContentElementType)
	@ApiProperty({
		enum: ContentElementType,
		description: 'the type of the updated element',
		enumName: 'ContentElementType',
	})
	type!: ContentElementType;
}

export class FileContentBody {
	@IsString()
	@ApiProperty({})
	caption!: string;

	@IsString()
	@ApiProperty({})
	alternativeText!: string;
}

export class FileElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.FILE })
	type!: ContentElementType.FILE;

	@ValidateNested()
	@ApiProperty()
	content!: FileContentBody;
}

export class LinkContentBody {
	@IsString()
	@ApiProperty({})
	url!: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	title?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	description?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	imageUrl?: string;
}

export class LinkElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.LINK })
	type!: ContentElementType.LINK;

	@ValidateNested()
	@ApiProperty({})
	content!: LinkContentBody;
}

export class DrawingContentBody {
	@IsString()
	@ApiProperty()
	description!: string;
}

export class DrawingElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.DRAWING })
	type!: ContentElementType.DRAWING;

	@ValidateNested()
	@ApiProperty()
	content!: DrawingContentBody;
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
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The point in time until when a submission can be handed in.',
	})
	dueDate?: Date;
}

export class SubmissionContainerElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.SUBMISSION_CONTAINER })
	type!: ContentElementType.SUBMISSION_CONTAINER;

	@ValidateNested()
	@ApiProperty()
	content!: SubmissionContainerContentBody;
}

export class ExternalToolContentBody {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	contextExternalToolId?: string;
}

export class ExternalToolElementContentBody extends ElementContentBody {
	@ApiProperty({ type: ContentElementType.EXTERNAL_TOOL })
	type!: ContentElementType.EXTERNAL_TOOL;

	@ValidateNested()
	@ApiProperty()
	content!: ExternalToolContentBody;
}

export type AnyElementContentBody =
	| FileContentBody
	| DrawingContentBody
	| LinkContentBody
	| RichTextContentBody
	| SubmissionContainerContentBody
	| ExternalToolContentBody;

export class UpdateElementContentBodyParams {
	@ValidateNested()
	@Type(() => ElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: FileElementContentBody, name: ContentElementType.FILE },
				{ value: LinkElementContentBody, name: ContentElementType.LINK },
				{ value: RichTextElementContentBody, name: ContentElementType.RICH_TEXT },
				{ value: SubmissionContainerElementContentBody, name: ContentElementType.SUBMISSION_CONTAINER },
				{ value: ExternalToolElementContentBody, name: ContentElementType.EXTERNAL_TOOL },
				{ value: ExternalToolElementContentBody, name: ContentElementType.DRAWING },
				{ value: DrawingElementContentBody, name: ContentElementType.DRAWING },
			],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(FileElementContentBody) },
			{ $ref: getSchemaPath(LinkElementContentBody) },
			{ $ref: getSchemaPath(RichTextElementContentBody) },
			{ $ref: getSchemaPath(SubmissionContainerElementContentBody) },
			{ $ref: getSchemaPath(ExternalToolElementContentBody) },
			{ $ref: getSchemaPath(DrawingElementContentBody) },
		],
	})
	data!:
		| FileElementContentBody
		| LinkElementContentBody
		| RichTextElementContentBody
		| SubmissionContainerElementContentBody
		| ExternalToolElementContentBody
		| DrawingElementContentBody;
}
