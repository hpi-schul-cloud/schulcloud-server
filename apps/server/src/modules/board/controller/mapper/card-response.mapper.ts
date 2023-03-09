import { Card } from '@shared/domain';
import { CardResponse, TextElementResponse, VisibilitySettingsResponse } from '../dto';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.elements.map(
				(element) =>
					new TextElementResponse({
						id: element.id,
						text: element.text,
					})
			),
			visibilitySettings: new VisibilitySettingsResponse({}),
		});
		return result;
	}
}
