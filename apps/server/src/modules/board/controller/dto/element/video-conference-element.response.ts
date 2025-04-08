import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class VideoConferenceElementContent {
	constructor({ title }: VideoConferenceElementContent) {
		this.title = title;
	}

	@ApiProperty()
	title: string;
}

export class VideoConferenceElementResponse {
	constructor({ id, content, timestamps, type }: VideoConferenceElementResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.type = type;
		this.content = content;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.VIDEO_CONFERENCE;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: VideoConferenceElementContent;
}
