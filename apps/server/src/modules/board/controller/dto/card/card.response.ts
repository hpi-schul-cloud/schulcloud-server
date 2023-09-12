import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { AnyContentElementResponse } from '../element';
import { RichTextElementResponse } from '../element/rich-text-element.response';
import { TimestampsResponse } from '../timestamps.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';

@ApiExtraModels(RichTextElementResponse)
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
			// TODO why only RichText ?
			oneOf: [{ $ref: getSchemaPath(RichTextElementResponse) }],
		},
	})
	elements: AnyContentElementResponse[];

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
