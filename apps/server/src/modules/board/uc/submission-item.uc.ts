import { Action } from '@modules/authorization';
import { BadRequestException, ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	BoardRoles,
	ContentElementType,
	FileElement,
	isFileElement,
	isRichTextElement,
	RichTextElement,
	UserWithBoardRoles,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ContentElementService, SubmissionItemService } from '../service';
import {
	BoardNodeAuthorizableService,
	BoardNodeService,
	BoardNodePermissionService,
	ContentElementCreateService,
} from '../poc/service';
import { SubmissionContainerElement, SubmissionItem, isSubmissionItem } from '../poc/domain';
import { BoardNodeRepo } from '../poc/repo';

@Injectable()
export class SubmissionItemUc {
	constructor(
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contentElementCreateService: ContentElementCreateService,
		private readonly submissionItemService: SubmissionItemService
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

		submissionItem.completed = completed;
		await this.boardNodeRepo.persistAndFlush(submissionItem);

		return submissionItem;
	}

	async deleteSubmissionItem(userId: EntityId, submissionItemId: EntityId): Promise<void> {
		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);
		await this.boardPermissionService.checkPermission(userId, submissionItem, Action.write);

		await this.boardNodeRepo.removeAndFlush(submissionItem);
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

		const element = this.contentElementCreateService.build(type);

		if (!isFileElement(element) && !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}
		this.boardNodeRepo.persist(element);
		submissionItem.addChild(element);
		await this.boardNodeRepo.persistAndFlush(submissionItem);

		return element;
	}
}
