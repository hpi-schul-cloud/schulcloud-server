import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class TaskElementContent {
	constructor({ dueDate }: TaskElementContent) {
		this.dueDate = dueDate;
	}

	@ApiProperty()
	dueDate: Date;
}

export class TaskElementResponse {
	constructor({ id, content, timestamps, type }: TaskElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.TASK;

	@ApiProperty()
	content: TaskElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
