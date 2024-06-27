import { Action } from '@modules/authorization';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AnyElementContentBody } from '../controller/dto';
import {
	AnyContentElement,
	BoardNodeFactory,
	isSubmissionItem,
	SubmissionContainerElement,
	SubmissionItem,
} from '../domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../service';

@Injectable()
export class ElementUc {
	constructor(
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElement(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElement> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		await this.boardNodeService.updateContent(element, content);

		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId): Promise<AnyContentElement> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, Action.write);

		await this.boardNodeService.delete(element);
		return element;
	}

	async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.boardNodeService.findContentElementById(elementId);
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
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(
			submissionContainerElement
		);
		if (this.boardPermissionService.isUserBoardEditor(userId, boardNodeAuthorizable.users)) {
			throw new ForbiddenException();
		}

		const submissionItem = this.boardNodeFactory.buildSubmissionItem({ completed, userId });

		await this.boardNodeService.addToParent(submissionContainerElement, submissionItem);

		return submissionItem;
	}
}
