import { ContentElementType, PlaceholderElement } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../dto';
import { PlaceholderElementContent, PlaceholderElementResponse } from '../dto/element/placeholder-element.response';
import { BaseResponseMapper } from './base-mapper.interface';

export class PlaceholderElementResponseMapper implements BaseResponseMapper {
	private static instance: PlaceholderElementResponseMapper;

	public static getInstance(): PlaceholderElementResponseMapper {
		if (!PlaceholderElementResponseMapper.instance) {
			PlaceholderElementResponseMapper.instance = new PlaceholderElementResponseMapper();
		}

		return PlaceholderElementResponseMapper.instance;
	}

	mapToResponse(element: PlaceholderElement): PlaceholderElementResponse {
		const result = new PlaceholderElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.PLACEHOLDER,
			content: new PlaceholderElementContent({
				title: element.previousElementDisplayName,
				deletedType: element.previousElementType,
			}),
		});

		return result;
	}

	canMap(element: PlaceholderElement): boolean {
		return element instanceof PlaceholderElement;
	}
}
