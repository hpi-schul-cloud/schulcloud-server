import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
	DrawingElementContentBody,
	ExternalToolElementContentBody,
	FileElementContentBody,
	FileFolderElementContentBody,
	H5pElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
	UpdateElementContentBodyParams,
	VideoConferenceElementContentBody,
} from '../element';
import { ValidateNested } from 'class-validator';

@ApiExtraModels(
	FileElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
	ExternalToolElementContentBody,
	VideoConferenceElementContentBody,
	FileFolderElementContentBody,
	H5pElementContentBody,
	DrawingElementContentBody,
	UpdateElementContentBodyParams
)
export class CreateCardImportBodyParams {
	@ApiProperty({
		description: 'The title of the card to be created.',
		type: String,
	})
	public cardTitle?: string;
	
	@ValidateNested({ each: true })
	@ApiProperty({
		description: 'The elements to be included in the card.',
		type: [UpdateElementContentBodyParams],
		items: {
			oneOf: [
				{ $ref: getSchemaPath(FileElementContentBody) },
				{ $ref: getSchemaPath(LinkElementContentBody) },
				{ $ref: getSchemaPath(RichTextElementContentBody) },
				{ $ref: getSchemaPath(SubmissionContainerElementContentBody) },
				{ $ref: getSchemaPath(ExternalToolElementContentBody) },
				{ $ref: getSchemaPath(VideoConferenceElementContentBody) },
				{ $ref: getSchemaPath(FileFolderElementContentBody) },
				{ $ref: getSchemaPath(H5pElementContentBody) },
				{ $ref: getSchemaPath(DrawingElementContentBody) },
			],
		},
	})
	public cardElements?: UpdateElementContentBodyParams[];

	constructor(cardTitle: string, cardElements: UpdateElementContentBodyParams[]) {
		this.cardTitle = cardTitle;
		this.cardElements = cardElements;
	}
}
