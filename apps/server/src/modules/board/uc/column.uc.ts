import { Action } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Card, ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { CardService, ColumnService } from '../service';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly boardPermissionService: BoardNodePermissionService,
		private readonly cardService: CardService,
		private readonly columnService: ColumnService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ColumnUc.name);
	}

	async deleteColumn(userId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		const column = await this.columnService.findById(columnId);
		await this.boardPermissionService.checkPermission(userId, column, Action.write);

		await this.columnService.delete(column);
	}

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.columnService.findById(columnId);
		await this.boardPermissionService.checkPermission(userId, column, Action.write);

		await this.columnService.updateTitle(column, title);
	}

	async createCard(userId: EntityId, columnId: EntityId, requiredEmptyElements?: ContentElementType[]): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		const column = await this.columnService.findById(columnId);
		await this.boardPermissionService.checkPermission(userId, column, Action.write);

		const card = await this.cardService.create(column, requiredEmptyElements);

		return card;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.cardService.findById(cardId);
		const targetColumn = await this.columnService.findById(targetColumnId);

		await this.boardPermissionService.checkPermission(userId, card, Action.write);
		await this.boardPermissionService.checkPermission(userId, targetColumn, Action.write);

		await this.cardService.move(card, targetColumn, targetPosition);
	}
}
