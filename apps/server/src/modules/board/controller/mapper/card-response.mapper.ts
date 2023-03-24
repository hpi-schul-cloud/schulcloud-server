import { Card } from '@shared/domain';
import { CardResponse, TimestampsResponse, VisibilitySettingsResponse } from '../dto';
import { TextElementResponseMapper } from './text-element-response.mapper';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.elements.map((element) => TextElementResponseMapper.mapToResponse(element)),
			visibilitySettings: new VisibilitySettingsResponse({}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: card.updatedAt, createdAt: card.createdAt }),
		});
		return result;
	}
}
