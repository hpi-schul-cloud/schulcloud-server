import { Logger } from '@core/logger';
import { AuthorizationContextBuilder } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyElementContentBody } from '../controller/dto';
import {
	AnyContentElement,
	BoardNodeFactory,
	ContentElementWithParentHierarchy,
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
		private readonly boardContextApiHelperService: BoardContextApiHelperService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	public async getElementWithParentHierarchy(
		userId: EntityId,
		elementId: EntityId
	): Promise<ContentElementWithParentHierarchy> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, AuthorizationContextBuilder.read([]));

		const parentHierarchy = await this.boardContextApiHelperService.getParentsOfElement(element.rootId);

		return { element, parentHierarchy };
	}

	public async updateElement(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElement> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, AuthorizationContextBuilder.write([]));

		await this.boardNodeService.updateContent(element, content);

		return element;
	}

	public async deleteElement(userId: EntityId, elementId: EntityId): Promise<EntityId> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		const { rootId } = element;
		await this.boardPermissionService.checkPermission(userId, element, AuthorizationContextBuilder.write([]));

		await this.boardNodeService.delete(element);
		return rootId;
	}

	public async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		await this.boardPermissionService.checkPermission(userId, element, AuthorizationContextBuilder.read([]));
	}

	public async createSubmissionItem(
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

		await this.boardPermissionService.checkPermission(
			userId,
			submissionContainerElement,
			AuthorizationContextBuilder.read([])
		);

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
