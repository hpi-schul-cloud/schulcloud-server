import { Card, TextElement } from '@shared/domain';
import { CardResponse, TimestampsResponse, VisibilitySettingsResponse } from '../dto';
import { TextElementResponseMapper } from './text-element-response.mapper';

export class CardResponseMapper {
	static mapToResponse(card: Card): CardResponse {
		const result = new CardResponse({
			id: card.id,
			title: card.title,
			height: card.height,
			elements: card.children.map((element) => {
				/* istanbul ignore next */
				if (!(element instanceof TextElement)) {
					throw new Error(`unsupported child type: ${element.constructor.name}`);
				}
				return TextElementResponseMapper.mapToResponse(element);
			}),
			visibilitySettings: new VisibilitySettingsResponse({}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: card.updatedAt, createdAt: card.createdAt }),
		});
		return result;
	}
}
