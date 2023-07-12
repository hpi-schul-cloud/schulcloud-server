import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId, SubmissionContainerElement, SubmissionItem } from '@shared/domain';
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

	async createSubmissionItem(userId: EntityId, contentElementId: EntityId): Promise<SubmissionItem> {
		const element = await this.elementService.findById(contentElementId);
		if (!(element instanceof SubmissionContainerElement))
			throw new HttpException(
				'Cannot create submission-item for non submission-container-element',
				HttpStatus.UNPROCESSABLE_ENTITY
			);
		await this.checkPermission(userId, element, Action.read);

		const subElement = await this.submissionItemService.create(userId, element);

		return subElement;
	}

	private async checkPermission(userId: EntityId, boardDo: AnyBoardDo, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}
}
