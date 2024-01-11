import { Action, AuthorizationService } from '@modules/authorization';
import { ForbiddenException, forwardRef, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	AnyBoardDo,
	AnyContentElementDo,
	isSubmissionContainerElement,
	isSubmissionItem,
	SubmissionItem,
	UserRoleEnum,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { SubmissionItemService } from '../service/submission-item.service';
import { BaseUc } from './base.uc';

@Injectable()
export class ElementUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly submissionItemService: SubmissionItemService,
		private readonly logger: Logger
	) {
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElementDo> {
		const element = await this.getElementWithWritePermission(userId, elementId);

		await this.elementService.update(element, content);
		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.getElementWithWritePermission(userId, elementId);

		await this.elementService.delete(element);
	}

	private async getElementWithWritePermission(userId: EntityId, elementId: EntityId): Promise<AnyContentElementDo> {
		const element = await this.elementService.findById(elementId);

		const parent: AnyBoardDo = await this.elementService.findParentOfId(elementId);

		if (isSubmissionItem(parent)) {
			await this.checkSubmissionItemWritePermission(userId, parent);
		} else {
			await this.checkPermission(userId, element, Action.write);
		}

		return element;
	}

	async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.elementService.findById(elementId);
		await this.checkPermission(userId, element, Action.read);
	}

	async createSubmissionItem(
		userId: EntityId,
		contentElementId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionContainerElement = await this.elementService.findById(contentElementId);

		if (!isSubmissionContainerElement(submissionContainerElement)) {
			throw new UnprocessableEntityException('Cannot create submission-item for non submission-container-element');
		}

		if (!submissionContainerElement.children.every((child) => isSubmissionItem(child))) {
			throw new UnprocessableEntityException(
				'Children of submission-container-element must be of type submission-item'
			);
		}

		const userSubmissionExists = submissionContainerElement.children
			.filter(isSubmissionItem)
			.find((item) => item.userId === userId);
		if (userSubmissionExists) {
			throw new ForbiddenException(
				'User is not allowed to have multiple submission-items per submission-container-element'
			);
		}

		await this.checkPermission(userId, submissionContainerElement, Action.read, UserRoleEnum.STUDENT);

		const submissionItem = await this.submissionItemService.create(userId, submissionContainerElement, { completed });

		return submissionItem;
	}
}
