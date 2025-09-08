import { ContentElementType } from '../enums/content-element-type.enum';
import { TimestampResponseDto } from './timestamp-response.dto';
import { VideoConferenceElementContentDto } from './video-conference-element-content.dto';

export class VideoConferenceElementResponseDto {
	id: string;

	type: ContentElementType;

	timestamps: TimestampResponseDto;

	content: VideoConferenceElementContentDto;

	constructor(
		id: string,
		type: ContentElementType,
		content: VideoConferenceElementContentDto,
		timestamps: TimestampResponseDto
	) {
		this.id = id;
		this.type = type;
		this.timestamps = timestamps;
		this.content = content;
	}
}
