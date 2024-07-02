import { ContentElementType, RichTextElement } from '../../domain';
import { TimestampsResponse } from '../dto';
import { RichTextElementContent, RichTextElementResponse } from '../dto/element/rich-text-element.response';
import { BaseResponseMapper } from './base-mapper.interface';

export class RichTextElementResponseMapper implements BaseResponseMapper {
	private static instance: RichTextElementResponseMapper;

	public static getInstance(): RichTextElementResponseMapper {
		if (!RichTextElementResponseMapper.instance) {
			RichTextElementResponseMapper.instance = new RichTextElementResponseMapper();
		}

		return RichTextElementResponseMapper.instance;
	}

	mapToResponse(element: RichTextElement): RichTextElementResponse {
		const result = new RichTextElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.RICH_TEXT,
			content: new RichTextElementContent({ text: element.text, inputFormat: element.inputFormat }),
		});

		return result;
	}

	canMap(element: RichTextElement): boolean {
		return element instanceof RichTextElement;
	}
}
