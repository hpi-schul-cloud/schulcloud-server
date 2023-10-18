import {
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionItemContent,
	RichTextElement,
	SubmissionItem,
	UserBoardRoles,
} from '@shared/domain';
import { UnprocessableEntityException } from '@nestjs/common';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { RichTextElementResponseMapper } from './rich-text-element-response.mapper';
import { SubmissionItemResponse, SubmissionsResponse, TimestampsResponse, UserDataResponse } from '../dto';

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
			elements: children.map((element) => {
				if (isFileElement(element)) {
					const mapper = FileElementResponseMapper.getInstance();
					return mapper.mapToResponse(element);
				}
				if (isRichTextElement(element)) {
					const mapper = RichTextElementResponseMapper.getInstance();
					return mapper.mapToResponse(element);
				}
				throw new UnprocessableEntityException();
			}),
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
