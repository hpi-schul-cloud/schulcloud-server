import { Action } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';
import { Card, Column } from '../poc/domain';
import { BoardNodeService, ContentElementCreateService } from '../poc/service';
import { BoardNodeRepo } from '../poc/repo';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly contentElementCreateService: ContentElementCreateService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ColumnUc.name);
	}

	async deleteColumn(userId: EntityId, columnId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		await this.boardNodeRepo.removeAndFlush(column);
	}

	async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<void> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		await this.boardNodeService.updateTitle(column, title);
	}

	async createCard(userId: EntityId, columnId: EntityId, requiredEmptyElements?: ContentElementType[]): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, Action.write);

		const card = new Card({
			id: new ObjectId().toHexString(),
			path: '',
			level: 2,
			position: 0,
			title: '',
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.boardNodeRepo.persist(card);

		column.addChild(card);
		this.boardNodeRepo.persist(column);

		requiredEmptyElements?.forEach((requiredEmptyElement) => {
			const element = this.contentElementCreateService.build(requiredEmptyElement);
			this.boardNodeRepo.persist(element);
			card.addChild(element);
		});

		await this.boardNodeRepo.flush();

		return card;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const targetColumn = await this.boardNodeService.findByClassAndId(Column, targetColumnId);

		await this.boardNodePermissionService.checkPermission(userId, card, Action.write);
		await this.boardNodePermissionService.checkPermission(userId, targetColumn, Action.write);

		await this.boardNodeService.move(card, targetColumn, targetPosition);
	}
}
