import { ApiProperty } from '@nestjs/swagger';
import { RichTextProps } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userId, description }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userId = userId;
		this.description = description;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userId: string;

	@ApiProperty()
	description: RichTextProps;
}
