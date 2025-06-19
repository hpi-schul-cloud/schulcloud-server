import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { CardElementParams } from './card-element.params';
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
} from '../element';

export class CardImportParams {
	@ApiProperty({
		type: 'string',
		pattern: bsonStringPattern,
		description: 'The ID of the card to which the content elements will be imported.',
	})
	public cardId: string;
	@ApiProperty({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				cardId: { type: 'string', pattern: bsonStringPattern },
				contentElementType: { enum: Object.values(ContentElementType) },
				contentElement: {
					type: 'array',
					items: {
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
					},
				},
			},
		},
		description: 'An array of content elements to be imported into the card.',
	})
	public cardElementsParams: CardElementParams[];

	constructor(cardId: string, cardElementsParams: CardElementParams[]) {
		this.cardId = cardId;
		this.cardElementsParams = cardElementsParams;
	}
}
