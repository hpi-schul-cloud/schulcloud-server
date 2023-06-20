import { ApiProperty } from '@nestjs/swagger';
import { ContentSubElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class SubmissionSubElementContent {
	constructor({ completed, userId }: SubmissionSubElementContent) {
		this.completed = completed;
		this.userId = userId;
	}

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userId: string;
}

export class SubmissionSubElementResponse {
	constructor({ id, content, timestamps, type }: SubmissionSubElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	type: ContentSubElementType.SUBMISSION;

	@ApiProperty()
	content: SubmissionSubElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
