import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { CardResponse } from './card.response';
import {
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	AnyContentElementResponse,
} from '../element';
import { ContentElementType } from '../../../domain';

export class CardImportResponse {
	@ApiProperty({
		description: 'The response containing the card details after import.',
		type: CardResponse,
	})
	public cardResponse: CardResponse;
	@ApiProperty({
		description: 'The content element to be added to the card.',
		discriminator: {
			propertyName: 'type',
			mapping: {
				EXTERNAL_TOOL: getSchemaPath(ExternalToolElementResponse),
				FILE: getSchemaPath(FileElementResponse),
				LINK: getSchemaPath(LinkElementResponse),
				RICH_TEXT: getSchemaPath(RichTextElementResponse),
				SUBMISSION_CONTAINER: getSchemaPath(SubmissionContainerElementResponse),
				DRAWING: getSchemaPath(DrawingElementResponse),
				COLLABORATIVE_TEXT_EDITOR: getSchemaPath(CollaborativeTextEditorElementResponse),
				DELETED: getSchemaPath(DeletedElementResponse),
				VIDEO_CONFERENCE: getSchemaPath(VideoConferenceElementResponse),
				FILE_FOLDER: getSchemaPath(FileFolderElementResponse),
				H5P: getSchemaPath(H5pElementResponse),
			},
		},
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
		isArray: true,
	})
	public contentElements: AnyContentElementResponse[];
	@ApiProperty({
		description: 'The types of content elements that were imported into the card.',
		type: 'array',
		items: {
			enum: Object.values(ContentElementType),
			type: 'string',
		},
	})
	public contentElementTypes: ContentElementType[];

	constructor(
		cardResponse: CardResponse,
		contentElementTypes: ContentElementType[],
		contentElements: AnyContentElementResponse[]
	) {
		this.cardResponse = cardResponse;
		this.contentElementTypes = contentElementTypes;
		this.contentElements = contentElements;
	}
}
