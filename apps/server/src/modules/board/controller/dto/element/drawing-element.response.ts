import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class DrawingElementContent {
	constructor({ drawingName, description }: DrawingElementContent) {
		this.drawingName = drawingName;
		this.description = description;
	}

	@ApiProperty()
	drawingName: string;

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

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.DRAWING;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: DrawingElementContent;
}
