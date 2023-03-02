import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { VisibilitySettingsResponse } from './visibility-settings.response';

export class ContentElementResponse {}

export enum BoardCardType {
	TASK = 'task',
	CONTENT = 'content',
	LEGACY_TASK = 'legacy-task',
	LEGACY_LESSON = 'legacy-lesson',
}

export class CardResponse {
	constructor({ id, title, elements, cardType, visibilitySettings }: CardResponse) {
		this.id = id;
		this.title = title;
		this.elements = elements;
		this.cardType = cardType;
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

	@ApiProperty({ enum: BoardCardType })
	cardType: BoardCardType;

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;
}
