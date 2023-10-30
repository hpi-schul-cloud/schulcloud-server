import { Card } from '@shared/domain/domainobject/board/card.do';
import { CardResponse } from '../dto/card/card.response';
import { VisibilitySettingsResponse } from '../dto/card/visibility-settings.response';
import { TimestampsResponse } from '../dto/timestamps.response';
import { ContentElementResponseFactory } from './content-element-response.factory';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.children.map((element) => ContentElementResponseFactory.mapToResponse(element)),
			visibilitySettings: new VisibilitySettingsResponse({}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: card.updatedAt, createdAt: card.createdAt }),
		});
		return result;
	}
}
