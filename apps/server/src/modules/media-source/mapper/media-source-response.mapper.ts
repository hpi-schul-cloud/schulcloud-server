import { Injectable } from '@nestjs/common';
import { MediaSourceListResponse, MediaSourceResponse } from '../api/response';
import { MediaSource } from '../do';

@Injectable()
export class MediaSourceResponseMapper {
	public static mapToMediaSourceResponse(mediaSource: MediaSource): MediaSourceResponse {
		const response: MediaSourceResponse = new MediaSourceResponse({
			id: mediaSource.id,
			name: mediaSource.name,
			sourceId: mediaSource.sourceId,
			format: mediaSource.format,
		});

		return response;
	}

	public static mapToMediaSourceListResponse(mediaSources: MediaSource[]): MediaSourceListResponse {
		const responses: MediaSourceResponse[] = mediaSources.map((mediaSource: MediaSource) =>
			this.mapToMediaSourceResponse(mediaSource)
		);

		const response: MediaSourceListResponse = new MediaSourceListResponse(responses);

		return response;
	}
}
