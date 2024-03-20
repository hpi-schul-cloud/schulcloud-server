import { Action, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, AnyContentElementDo, Card, ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { BoardDoAuthorizableService, CardService, ContentElementService } from '../service';
import { BaseUc } from './base.uc';

@Injectable()
export class CardUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly cardService: CardService,
		private readonly elementService: ContentElementService,
		private readonly logger: LegacyLogger
	) {
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		const cards = await this.cardService.findByIds(cardIds);
		const allowedCards = await this.filterAllowed(userId, cards, Action.read);

		return allowedCards;
	}

	async updateCardHeight(userId: EntityId, cardId: EntityId, height: number): Promise<void> {
		this.logger.debug({ action: 'updateCardHeight', userId, cardId, height });

		const card = await this.cardService.findById(cardId);
		await this.checkPermission(userId, card, Action.write);

		await this.cardService.updateHeight(card, height);
	}

	async updateCardTitle(userId: EntityId, cardId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateCardTitle', userId, cardId, title });

		const card = await this.cardService.findById(cardId);
		await this.checkPermission(userId, card, Action.write);

		await this.cardService.updateTitle(card, title);
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.cardService.findById(cardId);
		await this.checkPermission(userId, card, Action.write);

		await this.cardService.delete(card);
	}

	// --- elements ---

	async createElement(
		userId: EntityId,
		cardId: EntityId,
		type: ContentElementType,
		toPosition?: number
	): Promise<AnyContentElementDo> {
		this.logger.debug({ action: 'createElement', userId, cardId, type });

		const card = await this.cardService.findById(cardId);
		await this.checkPermission(userId, card, Action.write);

		const element = await this.elementService.create(card, type);
		if (toPosition !== undefined && typeof toPosition === 'number') {
			await this.elementService.move(element, card, toPosition);
		}

		return element;
	}

	async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveElement', userId, elementId, targetCardId, targetPosition });

		const element = await this.elementService.findById(elementId);
		const targetCard = await this.cardService.findById(targetCardId);

		await this.checkPermission(userId, element, Action.write);
		await this.checkPermission(userId, targetCard, Action.write);

		await this.elementService.move(element, targetCard, targetPosition);
	}

	private async filterAllowed<T extends AnyBoardDo>(userId: EntityId, boardDos: T[], action: Action): Promise<T[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const context = { action, requiredPermissions: [] };
		const promises = boardDos.map((boardDo) =>
			this.boardDoAuthorizableService.getBoardAuthorizable(boardDo).then((boardDoAuthorizable) => {
				return { boardDoAuthorizable, boardDo };
			})
		);
		const result = await Promise.all(promises);

		const allowed = result.reduce((allowedDos: T[], { boardDoAuthorizable, boardDo }) => {
			if (this.authorizationService.hasPermission(user, boardDoAuthorizable, context)) {
				allowedDos.push(boardDo);
			}
			return allowedDos;
		}, []);

		return allowed;
	}
}
