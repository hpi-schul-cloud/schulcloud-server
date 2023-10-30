import { SubmissionItem } from '@shared/domain/domainobject/board/submission-item.do';
import { UserBoardRoles } from '@shared/domain/domainobject/board/types/board-do-authorizable';
import { SubmissionItemResponse } from '../dto/submission-item/submission-item.response';
import { SubmissionsResponse } from '../dto/submission-item/submissions.response';
import { TimestampsResponse } from '../dto/timestamps.response';
import { UserDataResponse } from '../dto/user-data.response';

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
