import { Action, AuthorizationContext, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';

import { AnyContentElement, BoardNodeFactory, Card, ContentElementType } from '../poc/domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../poc/service';

@Injectable()
export class CardUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardPermissionService: BoardNodePermissionService,
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
		const promises = cards.map((card) =>
			this.boardNodeAuthorizableService.getBoardAuthorizable(card).then((boardNodeAuthorizable) => {
				return { boardNodeAuthorizable, boardDo: card };
			})
		);
		const result = await Promise.all(promises);

		const allowedCards = result.reduce((allowedDos: Card[], { boardNodeAuthorizable, boardDo }) => {
			if (this.authorizationService.hasPermission(user, boardNodeAuthorizable, context)) {
				allowedDos.push(boardDo);
			}
			return allowedDos;
		}, []);

		return allowedCards;
	}

	async updateCardHeight(userId: EntityId, cardId: EntityId, height: number): Promise<void> {
		this.logger.debug({ action: 'updateCardHeight', userId, cardId, height });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardPermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.updateHeight(card, height);
	}

	async updateCardTitle(userId: EntityId, cardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateCardTitle', userId, cardId, title });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardPermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.updateTitle(card, title);
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		await this.boardPermissionService.checkPermission(userId, card, Action.write);

		await this.boardNodeService.delete(card);
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
		await this.boardPermissionService.checkPermission(userId, card, Action.write);

		const element = this.boardNodeFactory.buildContentElement(type);

		await this.boardNodeService.addToParent(card, element, toPosition);

		return element;
	}

	async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveElement', userId, elementId, targetCardId, targetPosition });

		const element = await this.boardNodeService.findContentElementById(elementId, 0);
		const targetCard = await this.boardNodeService.findByClassAndId(Card, targetCardId, 0);

		await this.boardPermissionService.checkPermission(userId, element, Action.write);
		await this.boardPermissionService.checkPermission(userId, targetCard, Action.write);

		await this.boardNodeService.move(elementId, targetCardId, targetPosition);
	}
}
