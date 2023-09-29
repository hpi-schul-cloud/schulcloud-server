import { SubmissionItem, UserBoardRoles } from '@shared/domain';
import { SubmissionsResponse } from '../dto/submission-item/submissions.response';
import { SubmissionItemResponse, TimestampsResponse, UserDataResponse } from '../dto';

export class SubmissionItemResponseMapper {
	private static instance: SubmissionItemResponseMapper;

	public static getInstance(): SubmissionItemResponseMapper {
		if (!SubmissionItemResponseMapper.instance) {
			SubmissionItemResponseMapper.instance = new SubmissionItemResponseMapper();
		}

		return SubmissionItemResponseMapper.instance;
	}

	public mapToResponse(submissionItems: SubmissionItem[], users: UserBoardRoles[]): SubmissionsResponse {
		const submissionItemsResponse: SubmissionItemResponse[] = submissionItems.map((item) =>
			this.mapSubmissionsToResponse(item)
		);
		const usersResponse: UserDataResponse[] = users.map((user) => this.mapUsersToResponse(user));

		const response = new SubmissionsResponse(submissionItemsResponse, usersResponse);

		return response;
	}

	public mapSubmissionsToResponse(submissionItem: SubmissionItem): SubmissionItemResponse {
		const result = new SubmissionItemResponse({
			completed: submissionItem.completed,
			id: submissionItem.id,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: submissionItem.updatedAt,
				createdAt: submissionItem.createdAt,
			}),
			userId: submissionItem.userId,
		});

		return result;
	}

	private mapUsersToResponse(user: UserBoardRoles) {
		const result = new UserDataResponse({
			userId: user.userId,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
		});
		return result;
	}
}
