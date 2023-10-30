import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { ContentElementType } from '@shared/domain/domainobject/board/types/content-elements.enum';
import { LinkElementResponse, LinkElementContent } from '../dto/element/link-element.response';
import { TimestampsResponse } from '../dto/timestamps.response';
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
				imageUrl: element.imageUrl,
			}),
		});

		return result;
	}

	canMap(element: LinkElement): boolean {
		return element instanceof LinkElement;
	}
}
