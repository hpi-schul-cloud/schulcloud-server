import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { BoardCardType, ContentElementType } from '@shared/domain/entity/card.entity';
import { VisibilitySettingsResponse } from './visibility-settings.response';

export class ContentElementResponse {
	constructor({ id, type }: ContentElementResponse) {
		this.id = id;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType })
	type: ContentElementType;
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
