import { SubmissionItemResponse, UserDataResponse } from '@src/modules/board/controller/dto';
import { ApiProperty } from '@nestjs/swagger';

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
