import { Action } from '@modules/authorization';
import { BadRequestException, ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	BoardNodeFactory,
	BoardRoles,
	ContentElementType,
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
	UserWithBoardRoles,
} from '../poc/domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../poc/service';

@Injectable()
export class SubmissionItemUc {
	constructor(
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly boardNodeFactory: BoardNodeFactory
	) {}

	async findSubmissionItems(
		userId: EntityId,
		submissionContainerId: EntityId
	): Promise<{ submissionItems: SubmissionItem[]; users: UserWithBoardRoles[] }> {
		const submissionContainerElement = await this.boardNodeService.findByClassAndId(
			SubmissionContainerElement,
			submissionContainerId
		);

		await this.boardPermissionService.checkPermission(userId, submissionContainerElement, Action.read);

		let submissionItems = submissionContainerElement.children.filter(isSubmissionItem);

		const boardDoAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(
			submissionContainerElement
		);

		// only board readers can create submission items
		let users = boardDoAuthorizable.users.filter((user) => user.roles.includes(BoardRoles.READER));

		// board readers can only see their own submission item
		if (this.boardPermissionService.isUserBoardReader(userId, boardDoAuthorizable.users)) {
			submissionItems = submissionItems.filter((item) => item.userId === userId);
			users = [];
		}

		return { submissionItems, users };
	}

	async updateSubmissionItem(
		userId: EntityId,
		submissionItemId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);

		await this.boardPermissionService.checkPermission(userId, submissionItem, Action.write);

		await this.boardNodeService.updateCompleted(submissionItem, completed);

		return submissionItem;
	}

	async deleteSubmissionItem(userId: EntityId, submissionItemId: EntityId): Promise<void> {
		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);
		await this.boardPermissionService.checkPermission(userId, submissionItem, Action.write);

		await this.boardNodeService.delete(submissionItem);
	}

	async createElement(
		userId: EntityId,
		submissionItemId: EntityId,
		type: ContentElementType
	): Promise<FileElement | RichTextElement> {
		if (type !== ContentElementType.RICH_TEXT && type !== ContentElementType.FILE) {
			throw new BadRequestException();
		}

		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);

		const boardDoAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(submissionItem);

		if (!this.boardPermissionService.isUserBoardReader(userId, boardDoAuthorizable.users)) {
			throw new ForbiddenException();
		}

		await this.boardPermissionService.checkPermission(userId, submissionItem, Action.write);

		const element = this.boardNodeFactory.buildContentElement(type);

		await this.boardNodeService.addToParent(submissionItem, element);

		if (!isFileElement(element) || !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}

		return element;
	}
}
