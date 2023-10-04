import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	UnprocessableEntityException,
} from '@nestjs/common';
import {
	AnyBoardDo,
	ContentElementType,
	EntityId,
	FileElement,
	isSubmissionContainerElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionItem,
	UserBoardRoles,
	UserRoleEnum,
} from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';

@Injectable()
export class SubmissionItemUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly submissionItemService: SubmissionItemService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SubmissionItemUc.name);
	}

	async findSubmissionItems(
		userId: EntityId,
		submissionContainerId: EntityId
	): Promise<{ submissionItems: SubmissionItem[]; users: UserBoardRoles[] }> {
		const submissionContainerElement = await this.elementService.findById(submissionContainerId);

		if (!isSubmissionContainerElement(submissionContainerElement)) {
			throw new UnprocessableEntityException('Id is not belong to a submission container');
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
		await this.checkSubmissionItemPermission(userId, submissionItem);
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

		// TODO
		// await this.checkPermission(userId, submissionItem, Action.write);

		const element = await this.elementService.create(submissionItem, type);
		// TODO
		return element as FileElement | RichTextElement;
	}

	private async isAuthorizedStudent(userId: EntityId, boardDo: AnyBoardDo): Promise<boolean> {
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const userRoleEnum = boardDoAuthorizable.users.find((u) => u.userId === userId)?.userRoleEnum;

		if (!userRoleEnum) {
			throw new ForbiddenException('User not part of this board');
		}

		// TODO do this with permission instead of role and using authorizable rules
		if (userRoleEnum === UserRoleEnum.STUDENT) {
			return true;
		}

		return false;
	}

	private async checkSubmissionItemPermission(userId: EntityId, submissionItem: SubmissionItem) {
		await this.checkPermission(userId, submissionItem, Action.read, UserRoleEnum.STUDENT);
		if (submissionItem.userId !== userId) {
			throw new ForbiddenException();
		}
	}

	private async checkPermission(
		userId: EntityId,
		boardDo: AnyBoardDo,
		action: Action,
		requiredUserRole?: UserRoleEnum
	): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		if (requiredUserRole) {
			boardDoAuthorizable.requiredUserRole = requiredUserRole;
		}
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}
}
