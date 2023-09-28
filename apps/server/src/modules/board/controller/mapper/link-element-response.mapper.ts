import { ContentElementType, LinkElement } from '@shared/domain';
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
			content: new LinkElementContent({ url: element.url, openGraphData: element.openGraphData }),
		});

		return result;
	}

	canMap(element: LinkElement): boolean {
		return element instanceof LinkElement;
	}
}
