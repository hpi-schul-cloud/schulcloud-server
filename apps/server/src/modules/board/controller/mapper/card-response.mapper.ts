import { Card } from '@shared/domain';
import { CardResponse, TimestampsResponse, VisibilitySettingsResponse } from '../dto';
import { ContentElementResponseBuilder } from './content-element-response.builder';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.children.map((element) => ContentElementResponseBuilder.mapToResponse(element)),
			visibilitySettings: new VisibilitySettingsResponse({}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: card.updatedAt, createdAt: card.createdAt }),
		});
		return result;
	}
}
