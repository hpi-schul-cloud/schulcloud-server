import { MediaExternalToolElement } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { BaseResponseMapper } from '../../mapper/base-mapper.interface';
import { MediaExternalToolElementContent, MediaExternalToolElementResponse } from '../dto';

export class MediaExternalToolElementResponseMapper
	implements BaseResponseMapper<MediaExternalToolElement, MediaExternalToolElementResponse>
{
	private static instance: MediaExternalToolElementResponseMapper;

	public static getInstance(): MediaExternalToolElementResponseMapper {
		if (!MediaExternalToolElementResponseMapper.instance) {
			MediaExternalToolElementResponseMapper.instance = new MediaExternalToolElementResponseMapper();
		}

		return MediaExternalToolElementResponseMapper.instance;
	}

	mapToResponse(element: MediaExternalToolElement): MediaExternalToolElementResponse {
		const elementResponse = new MediaExternalToolElementResponse({
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
