import { BoardRoles, SubmissionItem, UserBoardRoles, UserRoleEnum } from '@shared/domain';
import { SubmissionItemResponse, TimestampsResponse, UserDataResponse } from '../dto';

export class SubmissionItemResponseMapper {
	private static instance: SubmissionItemResponseMapper;

	public static getInstance(): SubmissionItemResponseMapper {
		if (!SubmissionItemResponseMapper.instance) {
			SubmissionItemResponseMapper.instance = new SubmissionItemResponseMapper();
		}

		return SubmissionItemResponseMapper.instance;
	}

	public mapToResponse(submissionItem: SubmissionItem): SubmissionItemResponse {
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

	public mapUsersToResponse(user: UserBoardRoles) {
		const result = new UserDataResponse({
			userId: user.userId,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
		});
		return result;
	}
}
