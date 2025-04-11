import { ContentElementType, H5PElement } from '../../domain';
import { H5PElementContent, H5PElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class H5PElementResponseMapper implements BaseResponseMapper {
	private static instance: H5PElementResponseMapper;

	public static getInstance(): H5PElementResponseMapper {
		if (!H5PElementResponseMapper.instance) {
			H5PElementResponseMapper.instance = new H5PElementResponseMapper();
		}

		return H5PElementResponseMapper.instance;
	}

	public mapToResponse(element: H5PElement): H5PElementResponse {
		const result: H5PElementResponse = new H5PElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.H5P,
			content: new H5PElementContent({ contentId: element.contentId ?? null }),
		});

		return result;
	}

	public canMap(element: unknown): boolean {
		return element instanceof H5PElement;
	}
}
