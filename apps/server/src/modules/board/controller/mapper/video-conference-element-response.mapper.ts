import { ContentElementType, VideoConferenceElement } from '../../domain';
import { TimestampsResponse, VideoConferenceElementContent, VideoConferenceElementResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class VideoConferenceElementResponseMapper implements BaseResponseMapper {
	private static instance: VideoConferenceElementResponseMapper;

	public static getInstance(): VideoConferenceElementResponseMapper {
		if (!VideoConferenceElementResponseMapper.instance) {
			VideoConferenceElementResponseMapper.instance = new VideoConferenceElementResponseMapper();
		}

		return VideoConferenceElementResponseMapper.instance;
	}

	mapToResponse(element: VideoConferenceElement): VideoConferenceElementResponse {
		const result = new VideoConferenceElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.VIDEO_CONFERENCE,
			content: new VideoConferenceElementContent({ title: element.title }),
		});

		return result;
	}

	canMap(element: unknown): boolean {
		return element instanceof VideoConferenceElement;
	}
}
