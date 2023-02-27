import { MetaCard } from '@shared/domain';
import { CardResponse, VisibilitySettingsResponse, ContentElementResponse } from '../controller/dto';

export class CardResponseMapper {
	static mapToResponse(card: MetaCard): CardResponse {
		const result = new CardResponse({
			id: card.id,
			cardType: card.cardType,
			visibilitySettings: new VisibilitySettingsResponse({ publishedAt: card.publishedAt?.toISOString() }),
			elements: card.elements.map((element) => new ContentElementResponse(element)),
		});

		return result;
	}
}
