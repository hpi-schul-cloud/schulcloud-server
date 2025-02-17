import { MediaSourceListResponse, MediaSourceResponse } from '../api/response';
import { MediaSource } from '../domain';

export class MediaSourceResponseMapper {
	static mapToMediaSourceResponse(mediaSource: MediaSource): MediaSourceResponse {
		const response: MediaSourceResponse = new MediaSourceResponse({
			id: mediaSource.id,
			name: mediaSource.name,
			format: mediaSource.format,
		});

		return response;
	}

	static mapToMediaSourceListResponse(mediaSources: MediaSource[]): MediaSourceListResponse {
		const responses: MediaSourceResponse[] = mediaSources.map((mediaSource: MediaSource) =>
			this.mapToMediaSourceResponse(mediaSource)
		);

		return new MediaSourceListResponse(responses);
	}
}
