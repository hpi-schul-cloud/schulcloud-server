import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../timestamps.response';

export class SubmissionResponse {
	constructor({ id, timestamps, completed, userId }: SubmissionResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userId = userId;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userId: string;
}
