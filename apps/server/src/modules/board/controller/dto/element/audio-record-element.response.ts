import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class AudioRecordElementContent {
	constructor({ caption, alternativeText }: AudioRecordElementContent) {
		this.caption = caption;
		this.alternativeText = alternativeText;
	}

	@ApiProperty()
	@DecodeHtmlEntities()
	public caption: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public alternativeText: string;
}

export class AudioRecordElementResponse {
	constructor({ id, content, timestamps, type }: AudioRecordElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	public id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	public type: ContentElementType.AUDIO_RECORD;

	@ApiProperty()
	public content: AudioRecordElementContent;

	@ApiProperty()
	public timestamps: TimestampsResponse;
}
