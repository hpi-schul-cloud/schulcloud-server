import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { ContentElementResponse } from './content-element.response';
import { VisibilitySettingsResponse } from './visibility-settings.response';

export class CardResponse {
	constructor({ id, title, elements, visibilitySettings }: CardResponse) {
		this.id = id;
		this.title = title;
		this.elements = elements;
		this.visibilitySettings = visibilitySettings;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	title?: string;

	@ApiProperty({
		type: [ContentElementResponse],
	})
	elements: ContentElementResponse[];

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;
}
