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
	ContentElementType,
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionContainerElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionItem,
	UserBoardRoles,
	UserRoleEnum,
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
	): Promise<{ submissionItems: SubmissionItem[]; users: UserBoardRoles[] }> {
		const submissionContainerElement = await this.elementService.findById(submissionContainerId);

		if (!isSubmissionContainerElement(submissionContainerElement)) {
			throw new NotFoundException('Could not find a submission container with this id');
		}

		await this.checkPermission(userId, submissionContainerElement, Action.read);

		let submissionItems = submissionContainerElement.children.filter(isSubmissionItem);

		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);
		let users = boardDoAuthorizable.users.filter((user) => user.userRoleEnum === UserRoleEnum.STUDENT);
		const userRoleEnum = boardDoAuthorizable.users.find((u) => u.userId === userId)?.userRoleEnum;
		if (!userRoleEnum) {
			throw new ForbiddenException('User not part of this board');
		}
		if (userRoleEnum === UserRoleEnum.STUDENT) {
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

		this.checkCreator(userId, submissionItem);
		await this.checkPermission(userId, submissionItem, Action.read, UserRoleEnum.STUDENT);
		await this.submissionItemService.update(submissionItem, completed);

		return submissionItem;
	}

	async deleteSubmissionItem(userId: EntityId, submissionItemId: EntityId): Promise<void> {
		const submissionItem = await this.submissionItemService.findById(submissionItemId);
		this.checkCreator(userId, submissionItem);
		await this.checkPermission(userId, submissionItem, Action.read);

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

		this.checkCreator(userId, submissionItem);
		await this.checkPermission(userId, submissionItem, Action.read, UserRoleEnum.STUDENT);

		const element = await this.elementService.create(submissionItem, type);

		if (!isFileElement(element) && !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}

		return element;
	}
}
