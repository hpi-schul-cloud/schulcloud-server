import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import {
	ContentElementType,
	EntityId,
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionContainerElement,
	isSubmissionItem,
	Permission,
	RichTextElement,
	SubmissionItem,
	UserBoardRoles,
	UserRoleEnum,
} from '@shared/domain';
import { AuthorizationService, Action, PermissionContextService } from '@modules/authorization';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';
import { BaseUc } from './base.uc';

@Injectable()
export class SubmissionItemUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		protected readonly elementService: ContentElementService,
		protected readonly submissionItemService: SubmissionItemService,
		protected readonly permissionContextService: PermissionContextService
	) {
		super(authorizationService, boardDoAuthorizableService, permissionContextService);
	}

	private async filterByReadPermission(userId: EntityId, submissionItems: SubmissionItem[]): Promise<SubmissionItem[]> {
		const itemsWithPermission = await Promise.all(
			submissionItems.map(async (item) => {
				const hasPermission = await this.pocHasPermission(userId, item.id, [Permission.BOARD_ELEMENT_CAN_SUBMIT]);
				return { hasPermission, submissionItem: item };
			})
		);

		const filteredItems = itemsWithPermission.filter((item) => item.hasPermission).map((item) => item.submissionItem);

		return filteredItems;
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
		submissionItems = await this.filterByReadPermission(userId, submissionItems);

		const boardAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);
		let users = boardAuthorizable.users.filter((user) => user.userRoleEnum === UserRoleEnum.STUDENT);

		// NOTE: boardAuthorizable can be skipped
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
		await this.pocCheckPermission(userId, submissionItemId, [Permission.BOARD_ELEMENT_CAN_SUBMIT]);
		const submissionItem = await this.submissionItemService.findById(submissionItemId);
		// await this.checkSubmissionItemWritePermission(userId, submissionItem);
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
		await this.pocCheckPermission(userId, submissionItemId, [Permission.BOARD_ELEMENT_CAN_SUBMIT]);

		const submissionItem = await this.submissionItemService.findById(submissionItemId);

		// await this.checkSubmissionItemWritePermission(userId, submissionItem);

		const element = await this.elementService.create(submissionItem, type);

		if (!isFileElement(element) && !isRichTextElement(element)) {
			throw new UnprocessableEntityException();
		}

		return element;
	}
}
