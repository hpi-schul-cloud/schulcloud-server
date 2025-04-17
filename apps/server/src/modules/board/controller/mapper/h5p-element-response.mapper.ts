import { ContentElementType, H5pElement } from '../../domain';
import { H5pElementContent, H5pElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class H5pElementResponseMapper implements BaseResponseMapper {
	private static instance: H5pElementResponseMapper;

	public static getInstance(): H5pElementResponseMapper {
		if (!H5pElementResponseMapper.instance) {
			H5pElementResponseMapper.instance = new H5pElementResponseMapper();
		}

		return H5pElementResponseMapper.instance;
	}

	public mapToResponse(element: H5pElement): H5pElementResponse {
		const result: H5pElementResponse = new H5pElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.H5P,
			content: new H5pElementContent({ contentId: element.contentId ?? null }),
		});

		return result;
	}

	public canMap(element: unknown): boolean {
		return element instanceof H5pElement;
	}
}
