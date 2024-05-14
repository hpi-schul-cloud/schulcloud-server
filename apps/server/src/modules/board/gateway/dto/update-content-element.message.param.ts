import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain/domainobject';
import { Type } from 'class-transformer';
import { IsMongoId, ValidateNested } from 'class-validator';
import {
	DrawingElementContentBody,
	ElementContentBody,
	ExternalToolElementContentBody,
	FileElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
} from '../../controller/dto';

export class UpdateContentElementMessageParams {
	@IsMongoId()
	elementId!: string;

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
