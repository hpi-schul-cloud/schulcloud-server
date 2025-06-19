import { AnyContentElement, ContentElementType } from '../../../domain';
import {
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	VideoConferenceElementResponse,
} from '../element';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class CardElementParams {
	@ApiProperty({
		pattern: bsonStringPattern,
		description: 'The ID of the card to which the content element belongs.',
	})
	public cardId: string;
	@ApiProperty({
		type: 'string',
		enum: Object.values(ContentElementType),
		description: 'The type of content element to be added to the card.',
	})
	public contentElementType: ContentElementType;
	@ApiProperty({
		description: 'The content element to be added to the card.',
		oneOf: [
			{ $ref: getSchemaPath(ExternalToolElementResponse) },
			{ $ref: getSchemaPath(FileElementResponse) },
			{ $ref: getSchemaPath(LinkElementResponse) },
			{ $ref: getSchemaPath(RichTextElementResponse) },
			{ $ref: getSchemaPath(SubmissionContainerElementResponse) },
			{ $ref: getSchemaPath(DrawingElementResponse) },
			{ $ref: getSchemaPath(CollaborativeTextEditorElementResponse) },
			{ $ref: getSchemaPath(DeletedElementResponse) },
			{ $ref: getSchemaPath(VideoConferenceElementResponse) },
			{ $ref: getSchemaPath(FileFolderElementResponse) },
			{ $ref: getSchemaPath(H5pElementResponse) },
		],
	})
	public contentElement: AnyContentElement;
	@ApiProperty({
		description: 'The position in the card where the content element should be added.',
		type: 'number',
	})
	public toPosition?: number;

	constructor(
		cardId: string,
		contentElementType: ContentElementType,
		contentElement: AnyContentElement,
		toPosition?: number
	) {
		this.cardId = cardId;
		this.contentElementType = contentElementType;
		this.contentElement = contentElement;
		this.toPosition = toPosition;
	}
}
