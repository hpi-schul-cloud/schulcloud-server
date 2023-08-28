import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId, SubmissionContainerElement, SubmissionItem, UserRoleEnum } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
import { FileContentBody, RichTextContentBody, SubmissionContainerContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { SubmissionItemService } from '../service/submission-item.service';

@Injectable()
export class ElementUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly submissionItemService: SubmissionItemService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(
		userId: EntityId,
		elementId: EntityId,
		content: FileContentBody | RichTextContentBody | SubmissionContainerContentBody
	) {
		const element = await this.elementService.findById(elementId);

		await this.checkPermission(userId, element, Action.write);

		await this.elementService.update(element, content);
	}

	async createSubmissionItem(
		userId: EntityId,
		contentElementId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionContainer = (await this.elementService.findById(contentElementId)) as SubmissionContainerElement;

		if (!(submissionContainer instanceof SubmissionContainerElement))
			throw new HttpException(
				'Cannot create submission-item for non submission-container-element',
				HttpStatus.UNPROCESSABLE_ENTITY
			);

		if (!submissionContainer.children.every((child) => child instanceof SubmissionItem))
			throw new HttpException(
				'Children of submission-container-element must be of type submission-item',
				HttpStatus.UNPROCESSABLE_ENTITY
			);

		const userSubmissionExists = submissionContainer.children.find(
			(item) => (item as SubmissionItem).userId === userId
		);
		if (userSubmissionExists) {
			throw new HttpException(
				'User is not allowed to have multiple submission-items per submission-container-element',
				HttpStatus.NOT_ACCEPTABLE
			);
		}

		await this.checkPermission(userId, submissionContainer, Action.read, UserRoleEnum.STUDENT);

		const submissionItem = await this.submissionItemService.create(userId, submissionContainer, { completed });

		return submissionItem;
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
