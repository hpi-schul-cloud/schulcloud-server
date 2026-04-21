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
	VideoConferenceElementResponse,
} from '../element';
import { TimestampsResponse } from '../timestamps.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';
import { Colors } from '../../../domain';

@ApiExtraModels(
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	DrawingElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	H5pElementResponse
)
export class CardResponse {
	constructor({ id, title, backgroundColor, height, elements, visibilitySettings, timestamps }: CardResponse) {
		this.id = id;
		this.title = title;
		this.backgroundColor = backgroundColor;
		this.height = height;
		this.elements = elements;
		this.visibilitySettings = visibilitySettings;
		this.timestamps = timestamps;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	public id: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	public title?: string;

	@ApiProperty({ enum: Colors, enumName: 'Colors' })
	public backgroundColor: Colors;

	@ApiProperty()
	public height: number;

	@ApiProperty({
		type: 'array',
		items: {
			oneOf: [
				{ $ref: getSchemaPath(ExternalToolElementResponse) },
				{ $ref: getSchemaPath(FileElementResponse) },
				{ $ref: getSchemaPath(LinkElementResponse) },
				{ $ref: getSchemaPath(RichTextElementResponse) },
				{ $ref: getSchemaPath(DrawingElementResponse) },
				{ $ref: getSchemaPath(CollaborativeTextEditorElementResponse) },
				{ $ref: getSchemaPath(DeletedElementResponse) },
				{ $ref: getSchemaPath(VideoConferenceElementResponse) },
				{ $ref: getSchemaPath(FileFolderElementResponse) },
				{ $ref: getSchemaPath(H5pElementResponse) },
			],
		},
	})
	public elements: AnyContentElementResponse[];

	@ApiProperty()
	public visibilitySettings: VisibilitySettingsResponse;

	@ApiProperty()
	public timestamps: TimestampsResponse;
}
