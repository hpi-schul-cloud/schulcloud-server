import { ApiProperty } from '@nestjs/swagger';
import { UserDataResponse } from '../user-data.response';
import { SubmissionItemResponse } from './submission-item.response';

export class SubmissionsResponse {
	constructor(submissionItemsResponse: SubmissionItemResponse[], users: UserDataResponse[]) {
		this.submissionItemsResponse = submissionItemsResponse;
		this.users = users;
	}

	@ApiProperty({
		type: [SubmissionItemResponse],
	})
	submissionItemsResponse: SubmissionItemResponse[];

	@ApiProperty({
		type: [UserDataResponse],
	})
	users: UserDataResponse[];
}
