import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { TimestampsResponse } from '../timestamps.response';
import { AnyContentElementResponse } from './any-content-element.response';
import { TextElementResponse } from './text-element.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';

@ApiExtraModels(TextElementResponse)
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
			oneOf: [{ $ref: getSchemaPath(TextElementResponse) }],
		},
	})
	elements: AnyContentElementResponse[];

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
