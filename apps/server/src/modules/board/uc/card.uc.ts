import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';

import { AnyBoardNode, AnyContentElement, BoardNodeFactory, Card, ContentElementType } from '../domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../service';

@Injectable()
export class CardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(CardUc.name);
	}

	// TODO reactor: No reason to check permission for all cards; this is only cards from same board
	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		const cards = await this.boardNodeService.findByClassAndIds(Card, cardIds);

		const user = await this.authorizationService.getUserWithPermissions(userId);

		const context: AuthorizationContext = { action: Action.read, requiredPermissions: [] };
		const boardAuthorizables = await this.boardNodeAuthorizableService.getBoardAuthorizables(cards);

		const allowedCards = boardAuthorizables.reduce((allowedNodes: AnyBoardNode[], boardNodeAuthorizable) => {
			if (this.authorizationService.hasPermission(user, boardNodeAuthorizable, context)) {
				allowedNodes.push(boardNodeAuthorizable.boardNode);
			}
			return allowedNodes;
		}, []) as Card[];

		return allowedCards;
	}

	async updateCardHeight(userId: EntityId, cardId: EntityId, height: number): Promise<Card> {
		this.logger.debug({ action: 'updateCardHeight', userId, cardId, height });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.updateHeight(card, height);
		return card;
	}

	async updateCardTitle(userId: EntityId, cardId: EntityId, title: string): Promise<Card> {
		this.logger.debug({ action: 'updateCardTitle', userId, cardId, title });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.updateTitle(card, title);
		return card;
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<EntityId> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const { rootId } = card;
		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.delete(card);
		return rootId;
	}

	// --- elements ---

	async createElement(
		userId: EntityId,
		cardId: EntityId,
		type: ContentElementType,
		toPosition?: number
	): Promise<AnyContentElement> {
		this.logger.debug({ action: 'createElement', userId, cardId, type });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);

		const element = this.boardNodeFactory.buildContentElement(type);

		await this.boardNodeService.addToParent(card, element, toPosition);

		return element;
	}

	async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<AnyContentElement> {
		this.logger.debug({ action: 'moveElement', userId, elementId, targetCardId, targetPosition });

		const element = await this.boardNodeService.findContentElementById(elementId);
		const targetCard = await this.boardNodeService.findByClassAndId(Card, targetCardId);

		await this.boardNodePermissionService.checkPermission(userId, element, Action.write);
		await this.boardNodePermissionService.checkPermission(userId, targetCard, Action.write);

		await this.boardNodeService.move(element, targetCard, targetPosition);

		return element;
	}
}
