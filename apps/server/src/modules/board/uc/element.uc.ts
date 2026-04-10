import { Logger } from '@core/logger';
import { AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { Injectable } from '@nestjs/common';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { AnyElementContentBody } from '../controller/dto';
import { AnyContentElement, BoardNodeFactory, ContentElementWithParentHierarchy } from '../domain';
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
}
