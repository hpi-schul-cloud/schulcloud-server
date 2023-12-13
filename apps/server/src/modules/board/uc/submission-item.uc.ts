import { Action, AuthorizationService } from '@modules/authorization';
import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import {
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionContainerElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { UserBoardRoles, UserRoleEnum } from '@shared/domain/domainobject/board/types/board-do-authorizable';
import { ContentElementType } from '@shared/domain/domainobject/board/types/content-elements.enum';
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

		const boardAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);
		let users = boardAuthorizable.users.filter((user) => user.userRoleEnum === UserRoleEnum.STUDENT);

		const isAuthorizedStudent = await this.isAuthorizedStudent(userId, submissionContainerElement);
		if (isAuthorizedStudent) {
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
		await this.checkSubmissionItemWritePermission(userId, submissionItem);
		await this.submissionItemService.update(submissionItem, completed);

		return submissionItem;
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

		await this.checkSubmissionItemWritePermission(userId, submissionItem);

		const element = await this.elementService.create(submissionItem, type);

		if (!isFileElement(element) && !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}

		return element;
	}
}
