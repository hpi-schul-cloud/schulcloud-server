import { Action } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { BoardNodeFactory, Card, Column, ContentElementType } from '../domain';
import { BoardNodePermissionService, BoardNodeService } from '../service';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,

		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ColumnUc.name);
	}

	async deleteColumn(userId: EntityId, columnId: EntityId): Promise<EntityId> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const { rootId } = column;
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		await this.boardNodeService.delete(column);

		return rootId;
	}

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<Column> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		await this.boardNodeService.updateTitle(column, title);
		return column;
	}

	async createCard(
		userId: EntityId,
		columnId: EntityId,
		requiredEmptyElements: ContentElementType[] = []
	): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);

		await this.boardNodeService.addToParent(column, card);

		return card;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<Card> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const targetColumn = await this.boardNodeService.findByClassAndId(Column, targetColumnId);

		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);
		await this.boardNodePermissionService.checkPermission(userId, targetColumn, Action.write);

		await this.boardNodeService.move(card, targetColumn, targetPosition);
		return card;
	}
}
