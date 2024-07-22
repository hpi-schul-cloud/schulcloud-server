import {
	FileElement,
	isSubmissionItemContent,
	RichTextElement,
	SubmissionItem,
	UserWithBoardRoles,
} from '../../domain';
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

	public mapToResponse(submissionItems: SubmissionItem[], users: UserWithBoardRoles[]): SubmissionsResponse {
		const submissionItemsResponse: SubmissionItemResponse[] = submissionItems.map((item) =>
			this.mapSubmissionItemToResponse(item)
		);
		const usersResponse: UserDataResponse[] = users.map((user) => this.mapUsersToResponse(user));

		const response = new SubmissionsResponse(submissionItemsResponse, usersResponse);

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

	private mapUsersToResponse(user: UserWithBoardRoles) {
		const result = new UserDataResponse({
			userId: user.userId,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
		});
		return result;
	}
}
