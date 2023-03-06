import { Card } from '@shared/domain';
import { CardResponse, ContentElementResponse } from '../dto';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.elements.map(
				(element) =>
					new ContentElementResponse({
						id: element.id,
					})
			),
			visibilitySettings: {},
		});
		return result;
	}
}
