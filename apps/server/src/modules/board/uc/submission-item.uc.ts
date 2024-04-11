import { Action, AuthorizationService } from '@modules/authorization';
import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import {
	BoardRoles,
	ContentElementType,
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionContainerElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionItem,
	UserWithBoardRoles,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';
import { BaseUc } from './base.uc';

@Injectable()
export class SubmissionItemUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		protected readonly elementService: ContentElementService,
		protected readonly submissionItemService: SubmissionItemService
	) {
		super(authorizationService, boardDoAuthorizableService);
	}

	async findSubmissionItems(
		userId: EntityId,
		submissionContainerId: EntityId
	): Promise<{ submissionItems: SubmissionItem[]; users: UserWithBoardRoles[] }> {
		const submissionContainerElement = await this.elementService.findById(submissionContainerId);
		if (!isSubmissionContainerElement(submissionContainerElement)) {
			throw new NotFoundException('Could not find a submission container with this id');
		}

		await this.checkPermission(userId, submissionContainerElement, Action.read);

		let submissionItems = submissionContainerElement.children.filter(isSubmissionItem);

		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);

		// only board readers can create submission items
		let users = boardDoAuthorizable.users.filter((user) => user.roles.includes(BoardRoles.READER));

		// board readers can only see their own submission item
		if (this.isUserBoardReader(userId, boardDoAuthorizable.users)) {
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
		const submissionItem = await this.submissionItemService.findById(submissionItemId);

		await this.checkPermission(userId, submissionItem, Action.write);

		await this.submissionItemService.update(submissionItem, completed);

		return submissionItem;
	}

	async deleteSubmissionItem(userId: EntityId, submissionItemId: EntityId): Promise<void> {
		const submissionItem = await this.submissionItemService.findById(submissionItemId);
		await this.checkPermission(userId, submissionItem, Action.write);

		await this.submissionItemService.delete(submissionItem);
	}

	async createElement(
		userId: EntityId,
		submissionItemId: EntityId,
		type: ContentElementType
	): Promise<FileElement | RichTextElement> {
		if (type !== ContentElementType.RICH_TEXT && type !== ContentElementType.FILE) {
			throw new BadRequestException();
		}

		const submissionItem = await this.submissionItemService.findById(submissionItemId);

		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionItem);

		if (!this.isUserBoardReader(userId, boardDoAuthorizable.users)) {
			throw new ForbiddenException();
		}

		await this.checkPermission(userId, submissionItem, Action.write);

		const element = await this.elementService.create(submissionItem, type);

		if (!isFileElement(element) && !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}

		return element;
	}
}
