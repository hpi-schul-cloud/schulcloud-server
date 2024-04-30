import { Action } from '@modules/authorization';
import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	AnyContentElementDo,
	isSubmissionContainerElement,
	isSubmissionItem,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { SubmissionItemService } from '../service/submission-item.service';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';

@Injectable()
export class ElementUc {
	constructor(
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly elementService: ContentElementService,
		private readonly submissionItemService: SubmissionItemService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElement(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElementDo> {
		const element = await this.elementService.findById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		await this.elementService.update(element, content);
		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.elementService.findById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		await this.elementService.delete(element);
	}

	async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.elementService.findById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.read);
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

		await this.boardPermissionService.checkPermission(userId, submissionContainerElement, Action.read);

		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);
		if (this.boardPermissionService.isUserBoardEditor(userId, boardDoAuthorizable.users)) {
			throw new ForbiddenException();
		}

		const submissionItem = await this.submissionItemService.create(userId, submissionContainerElement, { completed });

		return submissionItem;
	}
}
