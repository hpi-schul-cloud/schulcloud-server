import { Action } from '@modules/authorization';
import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { AnyElementContentBody } from '../controller/dto';
import { BoardNodeAuthorizableService, BoardNodeService, ContentElementUpdateService } from '../poc/service';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';
import { SubmissionItem, isSubmissionItem, SubmissionContainerElement, AnyContentElement } from '../poc/domain';
import { BoardNodeRepo } from '../poc/repo';

@Injectable()
export class ElementUc {
	constructor(
		private readonly boardNodeAuthorizable: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contentElementUpdate: ContentElementUpdateService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElement(
		userId: EntityId,
		elementId: EntityId,
		type: ContentElementType,
		content: AnyElementContentBody
	): Promise<AnyContentElement> {
		const element = await this.boardNodeService.findContentElement(elementId);

		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		this.contentElementUpdate.update(element, content);
		await this.boardNodeRepo.persistAndFlush(element);

		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.boardNodeService.findContentElement(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		await this.boardNodeRepo.removeAndFlush(element);
	}

	async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.boardNodeService.findContentElement(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.read);
	}

	async createSubmissionItem(
		userId: EntityId,
		contentElementId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionContainerElement = await this.boardNodeService.findByClassAndId(
			SubmissionContainerElement,
			contentElementId
		);

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

		// TODO move this in service
		const boardNodeAuthorizable = await this.boardNodeAuthorizable.getBoardAuthorizable(submissionContainerElement);
		if (this.boardPermissionService.isUserBoardEditor(userId, boardNodeAuthorizable.users)) {
			throw new ForbiddenException();
		}

		const submissionItem = new SubmissionItem({
			id: new ObjectId().toHexString(),
			path: '',
			level: 4,
			position: 0,
			children: [],
			updatedAt: new Date(),
			createdAt: new Date(),
			userId,
			completed,
		});
		this.boardNodeRepo.persist(submissionItem);

		submissionContainerElement.addChild(submissionItem);
		await this.boardNodeRepo.persistAndFlush(submissionContainerElement);

		return submissionItem;
	}
}
