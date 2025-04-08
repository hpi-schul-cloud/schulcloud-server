import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class DrawingElementContent {
	constructor({ description }: DrawingElementContent) {
		this.description = description;
	}

	@ApiProperty()
	description: string;
}

export class DrawingElementResponse {
	constructor({ id, content, timestamps, type }: DrawingElementResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.type = type;
		this.content = content;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.DRAWING;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: DrawingElementContent;
}
