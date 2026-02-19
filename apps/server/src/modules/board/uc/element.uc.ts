import { Logger } from '@core/logger';
import { AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { AnyElementContentBody } from '../controller/dto';
import {
	AnyContentElement,
	BoardNodeFactory,
	ContentElementWithParentHierarchy,
	isSubmissionItem,
	SubmissionContainerElement,
	SubmissionItem,
} from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService } from '../service';

@Injectable()
export class ElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardContextApiHelperService: BoardContextApiHelperService,
		private readonly logger: Logger,
		private readonly boardNodeRule: BoardNodeRule
	) {
		this.logger.setContext(ElementUc.name);
	}

	public async getElementWithParentHierarchy(
		userId: EntityId,
		elementId: EntityId
	): Promise<ContentElementWithParentHierarchy> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const element = await this.boardNodeService.findContentElementById(elementId);
		const boardNode = await this.boardNodeService.findRoot(element);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		throwForbiddenIfFalse(this.boardNodeRule.can('viewElement', user, boardNodeAuthorizable));

		const parentHierarchy = await this.boardContextApiHelperService.getParentsOfElement(element.rootId);

		return { element, parentHierarchy };
	}

	public async updateElement(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElement> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const element = await this.boardNodeService.findContentElementById(elementId);
		const boardNode = await this.boardNodeService.findRoot(element);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateElement', user, boardNodeAuthorizable));

		await this.boardNodeService.updateContent(element, content);

		return element;
	}

	public async deleteElement(userId: EntityId, elementId: EntityId): Promise<EntityId> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const element = await this.boardNodeService.findContentElementById(elementId);
		const boardNode = await this.boardNodeService.findRoot(element);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		throwForbiddenIfFalse(this.boardNodeRule.can('deleteElement', user, boardNodeAuthorizable));

		const { rootId } = element; // needs to be captured before deletion
		await this.boardNodeService.delete(element);

		return rootId;
	}

	public async checkElementReadPermission(userId: EntityId, elementId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const element = await this.boardNodeService.findContentElementById(elementId);
		const boardNode = await this.boardNodeService.findRoot(element);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		throwForbiddenIfFalse(this.boardNodeRule.can('viewElement', user, boardNodeAuthorizable));
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

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNode = await this.boardNodeService.findRoot(submissionContainerElement);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		throwForbiddenIfFalse(this.boardNodeRule.can('viewElement', user, boardNodeAuthorizable));

		const submissionItem = this.boardNodeFactory.buildSubmissionItem({ completed, userId });

		await this.boardNodeService.addToParent(submissionContainerElement, submissionItem);

		return submissionItem;
	}
}
