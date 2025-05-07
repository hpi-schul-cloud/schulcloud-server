import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import {
	AnyContentElementResponse,
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
import { TimestampsResponse } from '../timestamps.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';

@ApiExtraModels(
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	DrawingElementResponse,
	SubmissionContainerElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	H5pElementResponse
)
export class CardResponse {
	constructor({ id, title, height, elements, visibilitySettings, timestamps }: CardResponse) {
		this.id = id;
		this.title = title;
		this.height = height;
		this.elements = elements;
		this.visibilitySettings = visibilitySettings;
		this.timestamps = timestamps;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	id: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	title?: string;

	@ApiProperty()
	height: number;

	@ApiProperty({
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
	})
	elements: AnyContentElementResponse[];

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
