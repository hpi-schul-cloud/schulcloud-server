import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { VisibilitySettingsResponse } from './visibility-settings.response';

export class ContentElementResponse {}

type BoardCardType = 'task' | 'content' | 'legacy-task' | 'legacy-lesson';

export class CardResponse {
	constructor({ id, height, title, elements, cardType, visibilitySettings }: CardResponse) {
		this.id = id;
		this.height = height;
		this.title = title;
		this.elements = elements;
		this.cardType = cardType;
		this.visibilitySettings = visibilitySettings;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description:
			'The approximate height of the referenced card. Intended to be used for prerendering purposes. Note, that different devices can lead to this value not being precise',
	})
	height: number;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		type: [ContentElementResponse],
	})
	elements: ContentElementResponse[];

	@ApiProperty()
	cardType: BoardCardType;

	@ApiProperty()
	visibilitySettings: VisibilitySettingsResponse;
}
