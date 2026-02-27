import { LegacyLogger } from '@core/logger';
import { AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { throwForbiddenIfFalse } from '@shared/common/utils';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { AnyBoardNode, AnyContentElement, BoardNodeFactory, Card, ContentElementType } from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService } from '../service';

@Injectable()
export class CardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly logger: LegacyLogger,
		private readonly boardNodeRule: BoardNodeRule
	) {
		this.logger.setContext(CardUc.name);
	}

	public async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardNodeService.findByClassAndIds(Card, cardIds);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardAuthorizables = await this.boardNodeAuthorizableService.getBoardAuthorizables(cards);

		const allowedCards = boardAuthorizables.reduce((allowedNodes: AnyBoardNode[], boardNodeAuthorizable) => {
			if (this.boardNodeRule.can('findCards', user, boardNodeAuthorizable)) {
				allowedNodes.push(boardNodeAuthorizable.boardNode);
			}
			return allowedNodes;
		}, []) as Card[];

		return allowedCards;
	}

	public async updateCardHeight(userId: EntityId, cardId: EntityId, height: number): Promise<Card> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(card);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateCardHeight', user, boardNodeAuthorizable));

		await this.boardNodeService.updateHeight(card, height);
		return card;
	}

	public async updateCardTitle(userId: EntityId, cardId: EntityId, title: string): Promise<Card> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(card);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateCardTitle', user, boardNodeAuthorizable));

		await this.boardNodeService.updateTitle(card, title);
		return card;
	}

	public async deleteCard(userId: EntityId, cardId: EntityId): Promise<EntityId> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(card);

		throwForbiddenIfFalse(this.boardNodeRule.can('deleteCard', user, boardNodeAuthorizable));

		const { rootId } = card; // needs to be captured before deletion
		await this.boardNodeService.delete(card);

		return rootId;
	}

	// --- elements ---

	public async createElement(
		userId: EntityId,
		cardId: EntityId,
		type: ContentElementType,
		toPosition?: number
	): Promise<AnyContentElement> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(card);

		throwForbiddenIfFalse(this.boardNodeRule.can('createElement', user, boardNodeAuthorizable));

		const element = this.boardNodeFactory.buildContentElement(type);

		await this.boardNodeService.addToParent(card, element, toPosition);

		return element;
	}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<AnyContentElement> {
		const element = await this.boardNodeService.findContentElementById(elementId);
		const targetCard = await this.boardNodeService.findByClassAndId(Card, targetCardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(targetCard);

		throwForbiddenIfFalse(this.boardNodeRule.can('moveElement', user, boardNodeAuthorizable));

		await this.boardNodeService.move(element, targetCard, targetPosition);

		return element;
	}
}
