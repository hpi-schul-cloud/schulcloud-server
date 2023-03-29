import { TextElement } from '@shared/domain';
import { ContentElementType } from '../../types/content-elements.enum';
import { TextElementContent, TextElementResponse, TimestampsResponse } from '../dto';

export class TextElementResponseMapper {
	static mapToResponse(element: TextElement): TextElementResponse {
		const result = new TextElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.TEXT,
			content: new TextElementContent({ text: element.text }),
		});

		return result;
	}
}
