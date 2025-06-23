import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
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
import { CardResponse } from './card.response';
import { ContentElementType } from '../../../domain';

@ApiExtraModels(
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
	H5pElementResponse
)
export class CardImportResponse {
	@ApiProperty({
		description: 'The response containing the card details after import.',
		type: CardResponse,
	})
	public cardResponse: CardResponse;

	@ApiProperty({
		description: 'The types of content elements that were imported into the card.',
		type: 'array',
		items: {
			enum: Object.values(ContentElementType),
		},
	})
	public contentElementTypes: ContentElementType[];

	constructor(cardResponse: CardResponse, contentElementTypes: ContentElementType[]) {
		this.cardResponse = cardResponse;
		this.contentElementTypes = contentElementTypes;
	}
}
