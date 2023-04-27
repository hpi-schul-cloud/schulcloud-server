import { TextElement } from '@shared/domain';
import { ContentElementType } from '../../types/content-element-type.enum';
import { TextElementContent, TextElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class TextElementResponseMapper implements BaseResponseMapper {
	private static instance: TextElementResponseMapper;

	public static getInstance(): TextElementResponseMapper {
		if (!TextElementResponseMapper.instance) {
			TextElementResponseMapper.instance = new TextElementResponseMapper();
		}

		return TextElementResponseMapper.instance;
	}

	mapToResponse(element: TextElement): TextElementResponse {
		const result = new TextElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.TEXT,
			content: new TextElementContent({ text: element.text }),
		});

		return result;
	}

	canMap(element: TextElement): boolean {
		return element instanceof TextElement;
	}
}
