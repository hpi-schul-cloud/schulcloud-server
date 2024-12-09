import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class VideoConferenceElementContent {
	constructor({ title, url }: VideoConferenceElementContent) {
		this.title = title;
		this.url = url;
	}

	@ApiProperty()
	title: string;

	@ApiProperty()
	url: string;
}

export class VideoConferenceElementResponse {
	constructor({ id, content, timestamps, type }: VideoConferenceElementResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.type = type;
		this.content = content;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.VIDEO_CONFERENCE;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: VideoConferenceElementContent;
}
