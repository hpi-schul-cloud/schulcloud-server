import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../timestamps.response';
import { UserDataResponse } from '../user-data.response';

export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userData }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userData = userData;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userData: UserDataResponse;
}
