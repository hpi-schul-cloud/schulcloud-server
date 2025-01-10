import { ContentElementType, LinkElement } from '../../domain';
import { LinkElementContent, LinkElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class LinkElementResponseMapper implements BaseResponseMapper {
	private static instance: LinkElementResponseMapper;

	public static getInstance(): LinkElementResponseMapper {
		if (!LinkElementResponseMapper.instance) {
			LinkElementResponseMapper.instance = new LinkElementResponseMapper();
		}

		return LinkElementResponseMapper.instance;
	}

	mapToResponse(element: LinkElement): LinkElementResponse {
		const result = new LinkElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.LINK,
			content: new LinkElementContent({
				url: element.url,
				title: element.title,
				description: element.description,
				originalImageUrl: element.originalImageUrl,
				imageUrl: element.imageUrl,
			}),
		});

		return result;
	}

	canMap(element: unknown): boolean {
		return element instanceof LinkElement;
	}
}
