import {
	FileElement,
	isContent,
	isFileElement,
	isRichTextElement,
	RichTextElement,
	SubmissionItem,
} from '@shared/domain';
import { ContentElementResponseFactory } from '@src/modules/board/controller/mapper/content-element-response.factory';
import { FileElementResponseMapper } from '@src/modules/board/controller/mapper/file-element-response.mapper';
import { RichTextElementResponseMapper } from '@src/modules/board/controller/mapper/rich-text-element-response.mapper';
import { UnprocessableEntityException } from '@nestjs/common';
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
		const children: (FileElement | RichTextElement)[] = submissionItem.children.filter(isContent);

		const result = new SubmissionItemResponse({
			completed: submissionItem.completed,
			id: submissionItem.id,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: submissionItem.updatedAt,
				createdAt: submissionItem.createdAt,
			}),
			userData: new UserDataResponse({
				// TODO: put valid user info here which comes from the submission owner
				firstName: 'John',
				lastName: 'Mr Doe',
				userId: submissionItem.userId,
			}),
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
}
