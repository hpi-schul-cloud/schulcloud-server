import type { MediaExternalToolElement } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaExternalToolElementContent, MediaExternalToolElementResponse } from '../dto';

export class MediaExternalToolElementResponseMapper {
	static mapToResponse(element: MediaExternalToolElement): MediaExternalToolElementResponse {
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
}
