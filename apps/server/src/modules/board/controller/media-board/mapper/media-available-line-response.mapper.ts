import { MediaAvailableLine, MediaAvailableLineElement } from '../../../domain';
import { MediaAvailableLineElementResponse, MediaAvailableLineResponse } from '../dto';

export class MediaAvailableLineResponseMapper {
	public static mapToResponse(mediaAvailableLine: MediaAvailableLine): MediaAvailableLineResponse {
		const result = new MediaAvailableLineResponse({
			elements: this.mapMediaAvailableLineElementToResponse(mediaAvailableLine.elements),
			backgroundColor: mediaAvailableLine.backgroundColor,
			collapsed: mediaAvailableLine.collapsed,
		});

		return result;
	}

	private static mapMediaAvailableLineElementToResponse(
		elements: MediaAvailableLineElement[]
	): MediaAvailableLineElementResponse[] {
		return elements.map(
			(element) =>
				new MediaAvailableLineElementResponse({
					schoolExternalToolId: element.schoolExternalToolId,
					name: element.name,
					domain: element.domain,
					description: element.description,
					logoUrl: element.logoUrl,
					thumbnailUrl: element.thumbnailUrl,
				})
		);
	}
}
