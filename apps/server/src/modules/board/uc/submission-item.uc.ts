import { ForbiddenException, forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId, SubmissionContainerElement, SubmissionItem, UserRoleEnum } from '@shared/domain';
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

	async findSubmissionItems(userId: EntityId, submissionContainerId: EntityId): Promise<SubmissionItem[]> {
		const submissionContainer = await this.getSubmissionContainer(submissionContainerId);
		await this.checkPermission(userId, submissionContainer, Action.read);

		let submissionItems = submissionContainer.children as SubmissionItem[];

		if (!submissionItems.every((child) => child instanceof SubmissionItem)) {
			throw new HttpException(
				'Children of submission-container-element must be of type submission-item',
				HttpStatus.UNPROCESSABLE_ENTITY
			);
		}

		const isStudent = await this.isAuthorizedStudent(userId, submissionContainer);
		if (isStudent) {
			submissionItems = submissionItems.filter((item) => item.userId === userId);
		}

		return submissionItems;
	}

	async updateSubmissionItem(
		userId: EntityId,
		submissionItemId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionItem = await this.submissionItemService.findById(submissionItemId);

		await this.checkPermission(userId, submissionItem, Action.read, UserRoleEnum.STUDENT);
		if (submissionItem.userId !== userId) {
			throw new ForbiddenException();
		}

		await this.submissionItemService.update(submissionItem, completed);

		return submissionItem;
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

	private async getSubmissionContainer(submissionContainerId: EntityId): Promise<SubmissionContainerElement> {
		const submissionContainer = (await this.elementService.findById(
			submissionContainerId
		)) as SubmissionContainerElement;

		if (!(submissionContainer instanceof SubmissionContainerElement)) {
			throw new HttpException('Id does not belong to a submission container', HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return submissionContainer;
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
