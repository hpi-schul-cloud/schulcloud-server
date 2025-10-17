import { LegacyLogger } from '@core/logger';
import { StorageLocation } from '@infra/files-storage-client';
import { AuthorizationContextBuilder } from '@modules/authorization';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardNodeFactory, Card, Column, ContentElementType, isCard, isColumn } from '../domain';
import { BoardNodePermissionService, BoardNodeService, ColumnBoardService } from '../service';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeFactory: BoardNodeFactory,

		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ColumnUc.name);
	}

	public async deleteColumn(userId: EntityId, columnId: EntityId): Promise<EntityId> {
		this.logger.debug({ action: 'deleteColumn', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const { rootId } = column;
		await this.boardNodePermissionService.checkPermission(userId, column, AuthorizationContextBuilder.write([]));

		await this.boardNodeService.delete(column);

		return rootId;
	}

	public async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<Column> {
		this.logger.debug({ action: 'updateColumnTitle', userId, columnId, title });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, AuthorizationContextBuilder.write([]));

		await this.boardNodeService.updateTitle(column, title);
		return column;
	}

	public async createCard(
		userId: EntityId,
		columnId: EntityId,
		requiredEmptyElements: ContentElementType[] = []
	): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, columnId });

		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		await this.boardNodePermissionService.checkPermission(userId, column, AuthorizationContextBuilder.write([]));

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);

		await this.boardNodeService.addToParent(column, card);

		return card;
	}

	public async moveCard(
		userId: EntityId,
		cardId: EntityId,
		targetColumnId: EntityId,
		targetPosition: number
	): Promise<Card> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		const targetColumn = await this.boardNodeService.findByClassAndId(Column, targetColumnId);

		await this.boardNodePermissionService.checkPermission(userId, card, AuthorizationContextBuilder.write([]));
		await this.boardNodePermissionService.checkPermission(userId, targetColumn, AuthorizationContextBuilder.write([]));

		await this.boardNodeService.move(card, targetColumn, targetPosition);
		return card;
	}

	public async copyCard(userId: EntityId, cardId: EntityId, schoolId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'copyCard', userId, cardId, schoolId });

		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		if (!card.parentId) {
			throw new UnprocessableEntityException('Card has no parent column');
		}

		await this.boardNodePermissionService.checkPermission(userId, card, AuthorizationContextBuilder.write([]));

		const copyStatus = await this.columnBoardService.copyCard({
			originalCardId: card.id,
			userId,
			targetStorageLocationReference: { id: schoolId, type: StorageLocation.SCHOOL },
			sourceStorageLocationReference: { id: schoolId, type: StorageLocation.SCHOOL },
			targetSchoolId: schoolId,
		});

		if (!isCard(copyStatus.copyEntity)) {
			throw new InternalServerErrorException('Copied entity is not a card');
		}

		return copyStatus.copyEntity;
	}
}
