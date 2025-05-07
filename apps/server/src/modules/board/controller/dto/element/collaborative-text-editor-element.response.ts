import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class CollaborativeTextEditorElementResponse {
	constructor(props: CollaborativeTextEditorElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.timestamps = props.timestamps;
		this.content = props.content;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.COLLABORATIVE_TEXT_EDITOR;

	@ApiProperty()
	timestamps: TimestampsResponse;

	// This is required due to the nuxt-client content element handling, but otherwise not used.
	@ApiProperty()
	content: object;
}
