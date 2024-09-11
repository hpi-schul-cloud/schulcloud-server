import { MediaExternalToolElement } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaExternalToolElementContent, MediaExternalToolElementResponse } from '../dto';

export class MediaExternalToolElementResponseMapper {
	private static instance: MediaExternalToolElementResponseMapper;

	public static getInstance(): MediaExternalToolElementResponseMapper {
		if (!MediaExternalToolElementResponseMapper.instance) {
			MediaExternalToolElementResponseMapper.instance = new MediaExternalToolElementResponseMapper();
		}

		return MediaExternalToolElementResponseMapper.instance;
	}

	mapToResponse(element: MediaExternalToolElement): MediaExternalToolElementResponse {
		const elementResponse: MediaExternalToolElementResponse = new MediaExternalToolElementResponse({
			id: element.id,
			content: new MediaExternalToolElementContent({
				contextExternalToolId: element.contextExternalToolId,
			}),
			timestamps: new TimestampsResponse({
				lastUpdatedAt: element.updatedAt,
				createdAt: element.createdAt,
			}),
		});

		return elementResponse;
	}

	canMap(element: MediaExternalToolElement): boolean {
		return element instanceof MediaExternalToolElement;
	}
}
