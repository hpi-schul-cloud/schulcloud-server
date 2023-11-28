import { FileElement, isSubmissionItemContent, RichTextElement, SubmissionItem, UserBoardRoles } from '@shared/domain';
import { SubmissionItemResponse, SubmissionsResponse, TimestampsResponse, UserDataResponse } from '../dto';
import { ContentElementResponseFactory } from './content-element-response.factory';

export class SubmissionItemResponseMapper {
	private static instance: SubmissionItemResponseMapper;

	public static getInstance(): SubmissionItemResponseMapper {
		if (!SubmissionItemResponseMapper.instance) {
			SubmissionItemResponseMapper.instance = new SubmissionItemResponseMapper();
		}

		return SubmissionItemResponseMapper.instance;
	}

	public mapToResponse(submissionItems: SubmissionItem[], users: UserDataResponse[]): SubmissionsResponse {
		const submissionItemsResponse: SubmissionItemResponse[] = submissionItems.map((item) =>
			this.mapSubmissionItemToResponse(item)
		);

		const response = new SubmissionsResponse(submissionItemsResponse, users);

		return response;
	}

	public mapSubmissionItemToResponse(submissionItem: SubmissionItem): SubmissionItemResponse {
		const children: (FileElement | RichTextElement)[] = submissionItem.children.filter(isSubmissionItemContent);
		const result = new SubmissionItemResponse({
			completed: submissionItem.completed,
			id: submissionItem.id,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: submissionItem.updatedAt,
				createdAt: submissionItem.createdAt,
			}),
			userId: submissionItem.userId,
			elements: children.map((element) => ContentElementResponseFactory.mapSubmissionContentToResponse(element)),
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
