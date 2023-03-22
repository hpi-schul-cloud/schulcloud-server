import { TextElement } from '@shared/domain';
import { TextElementResponse, TimestampsResponse } from '../dto';

export class TextElementResponseMapper {
	static mapToResponse(element: TextElement): TextElementResponse {
		const result = new TextElementResponse({
			id: element.id,
			text: element.text,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
		});

		return result;
	}
}
