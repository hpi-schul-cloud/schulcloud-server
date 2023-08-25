import { ForbiddenException, forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId, SubmissionContainerElement, SubmissionItem, UserRoleEnum } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
import { BoardDoAuthorizableService, ContentElementService } from '../service';

@Injectable()
export class SubmissionItemUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SubmissionItemUc.name);
	}

	async findSubmissionItems(userId: EntityId, submissionContainerId: EntityId): Promise<SubmissionItem[]> {
		const submissionContainer = (await this.elementService.findById(
			submissionContainerId
		)) as SubmissionContainerElement;

		if (!(submissionContainer instanceof SubmissionContainerElement))
			throw new HttpException('Id does not belong to a submission container', HttpStatus.UNPROCESSABLE_ENTITY);

		const submissionItems = submissionContainer.children as SubmissionItem[];

		if (!submissionItems.every((child) => child instanceof SubmissionItem))
			throw new HttpException(
				'Children of submission-container-element must be of type submission-item',
				HttpStatus.UNPROCESSABLE_ENTITY
			);

		await this.checkPermission(userId, submissionContainer, Action.read);

		if (await this.isStudent(userId, submissionContainer)) {
			return submissionItems.filter((item) => item.userId === userId);
		}

		return submissionItems;
	}

	private async isStudent(userId: EntityId, boardDo: AnyBoardDo): Promise<boolean> {
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const userRoleEnum = boardDoAuthorizable.users.find((u) => u.userId === userId)?.userRoleEnum;
		if (!userRoleEnum) throw new ForbiddenException('User not part of this board');
		return userRoleEnum === UserRoleEnum.STUDENT;
	}

	private async checkPermission(
		userId: EntityId,
		boardDo: AnyBoardDo,
		action: Action,
		requiredUserRole?: UserRoleEnum
	): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		if (requiredUserRole) boardDoAuthorizable.requiredUserRole = requiredUserRole;
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}
}
