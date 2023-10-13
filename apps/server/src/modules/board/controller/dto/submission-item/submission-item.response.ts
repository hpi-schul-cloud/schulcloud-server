import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../timestamps.response';
import { FileElementResponse, RichTextElementResponse } from '../element';

export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userId, elements }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userId = userId;
		this.elements = elements;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	userId: string;

	@ApiProperty({
		type: 'array',
		// TODO add types
	})
	elements: (RichTextElementResponse | FileElementResponse)[];
}
