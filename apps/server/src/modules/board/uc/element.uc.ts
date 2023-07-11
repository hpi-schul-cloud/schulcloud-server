import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	ContentSubElementType,
	EntityId,
	SubmissionBoard,
	SubmissionContainerElement,
	SubmissionSubElement,
} from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
import { SubmissionBoardService } from '../service/submission.service';
// import { SubmissionSubElementContentBody } from './';
import { FileContentBody, RichTextContentBody, SubmissionContainerContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService, ContentSubElementService } from '../service';

@Injectable()
export class ElementUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly subElementService: ContentSubElementService,
		private readonly submissionBoardService: SubmissionBoardService,
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

	private async checkPermission(userId: EntityId, boardDo: AnyBoardDo, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}

	// TODO: remove this
	async createSubElement(
		userId: EntityId,
		contentElementId: EntityId,
		type: ContentSubElementType
	): Promise<SubmissionSubElement> {
		const element = await this.elementService.findById(contentElementId);

		// TODO
		await this.checkPermission(userId, element, Action.read);

		// TODO pass in value directly on create - no create empty stuff?
		const subElement = await this.subElementService.create(userId, element, type);

		return subElement;
	}

	// TODO: remove this
	async deleteSubElement(userId: EntityId, elementId: EntityId): Promise<void> {
		// this.logger.debug({ action: 'deleteSubElement', userId, elementId });

		const subElement = await this.subElementService.findById(elementId);

		// TODO
		await this.checkPermission(userId, subElement, Action.read);

		await this.subElementService.delete(subElement);
	}

	async createSubmissionBoard(userId: EntityId, contentElementId: EntityId): Promise<SubmissionBoard> {
		const element = await this.elementService.findById(contentElementId);
		if (!(element instanceof SubmissionContainerElement))
			throw new HttpException('Cannot create submission for non-task element', HttpStatus.UNPROCESSABLE_ENTITY);

		// TODO
		await this.checkPermission(userId, element, Action.read);

		// TODO pass in value directly on create - no create empty stuff?
		const subElement = await this.submissionBoardService.create(userId, element);

		return subElement;
	}

	async deleteSubmissionBoard(userId: EntityId, submissionId: EntityId): Promise<void> {
		const submission = await this.submissionBoardService.findById(submissionId);
		await this.checkPermission(userId, submission, Action.write);
		await this.submissionBoardService.delete(submission);
	}
}
