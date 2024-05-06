import { Action } from '@modules/authorization';
import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	AnyContentElementDo, ContentElementType,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';
import { SubmissionItem, isSubmissionItem, SubmissionContainerElement getBoardNodeConstructor } from '../poc/domain';
import { BoardNodeService } from '../poc/service';
import { ObjectId } from "@mikro-orm/mongodb";
import { BoardNodeRepo } from "../poc/repo";
import {BoardNodeType} from "../poc/domain";

@Injectable()
export class ElementUc {
	constructor(
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly boarNodeRepo: BoardNodeRepo,
		private readonly elementService: ContentElementService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElement(
		userId: EntityId,
		elementId: EntityId,
		type: ContentElementType,
		content: AnyElementContentBody
	): Promise<AnyContentElementDo> {
		const element = await this.boardNodeService.findByClassAndId(getBoardNodeConstructor(type), elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		const updatedElement = await this.elementService.update(element, content);
		return updatedElement;
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
		const submissionContainerElement = await this.boardNodeService.findByClassAndId(SubmissionContainerElement, contentElementId);

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
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(submissionContainerElement);
		if (this.boardPermissionService.isUserBoardEditor(userId, boardDoAuthorizable.users)) {
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
		this.boarNodeRepo.persist(submissionItem);

		submissionContainerElement.addChild(submissionItem);
		await this.boarNodeRepo.persistAndFlush(submissionContainerElement);


		return submissionItem;
	}
}
