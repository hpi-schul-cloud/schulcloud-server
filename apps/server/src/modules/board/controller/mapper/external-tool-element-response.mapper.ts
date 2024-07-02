import { ContentElementType, ExternalToolElement } from '../../domain';
import { ExternalToolElementContent, ExternalToolElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class ExternalToolElementResponseMapper implements BaseResponseMapper {
	private static instance: ExternalToolElementResponseMapper;

	public static getInstance(): ExternalToolElementResponseMapper {
		if (!ExternalToolElementResponseMapper.instance) {
			ExternalToolElementResponseMapper.instance = new ExternalToolElementResponseMapper();
		}

		return ExternalToolElementResponseMapper.instance;
	}

	mapToResponse(element: ExternalToolElement): ExternalToolElementResponse {
		const result = new ExternalToolElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.EXTERNAL_TOOL,
			content: new ExternalToolElementContent({ contextExternalToolId: element.contextExternalToolId ?? null }),
		});

		return result;
	}

	canMap(element: ExternalToolElement): boolean {
		return element instanceof ExternalToolElement;
	}
}
