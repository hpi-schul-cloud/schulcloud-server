import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import {
	AnyContentElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
} from '../element';
import { CollaborativeTextEditorElementResponse } from '../element/collaborative-text-editor-element.response';
import { TimestampsResponse } from '../timestamps.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';

@ApiExtraModels(
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	DrawingElementResponse,
	SubmissionContainerElementResponse,
	CollaborativeTextEditorElementResponse
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
		pattern: '[a-f0-9]{24}',
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
			],
		},
	})
	elements: AnyContentElementResponse[];

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
