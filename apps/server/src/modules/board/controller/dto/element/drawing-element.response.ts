import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class DrawingElementResponse {
	constructor({ id, drawingName, timestamps, type }: DrawingElementResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.type = type;
		this.drawingName = drawingName;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.DRAWING;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	drawingName: string;
}
