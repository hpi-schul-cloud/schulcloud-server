import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class SubmissionContainerElementContent {
	constructor({ dueDate }: SubmissionContainerElementContent) {
		this.dueDate = dueDate;
	}

	@ApiProperty({
		type: Date,
		description: 'The dueDate as date string or null of not set',
		example: '2023-08-17T14:17:51.958+00:00',
	})
	dueDate: Date | null;
}

export class SubmissionContainerElementResponse {
	constructor({ id, content, timestamps, type }: SubmissionContainerElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.SUBMISSION_CONTAINER;

	@ApiProperty()
	content: SubmissionContainerElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
