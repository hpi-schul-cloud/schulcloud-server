import { LegacyLogger } from '@core/logger';
import { StorageLocation } from '@infra/files-storage-client';
import { AuthorizationService } from '@modules/authorization';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { BoardNodeFactory, Card, Column, ColumnBoard, ContentElementType, isCard } from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService, ColumnBoardService } from '../service';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeFactory: BoardNodeFactory,

		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ColumnUc.name);
	}

	public async deleteColumn(userId: EntityId, columnId: EntityId): Promise<EntityId> {
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(column);

		throwForbiddenIfFalse(this.boardNodeRule.can('deleteColumn', user, boardNodeAuthorizable));

		const { rootId } = column; // needs to be captured before deletion
		await this.boardNodeService.delete(column);

		return rootId;
	}

	public async updateColumnTitle(userId: EntityId, columnId: EntityId, title: string): Promise<Column> {
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(column);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateColumnTitle', user, boardNodeAuthorizable));

		await this.boardNodeService.updateTitle(column, title);
		return column;
	}

	public async createCard(
		userId: EntityId,
		columnId: EntityId,
		requiredEmptyElements: ContentElementType[] = []
	): Promise<Card> {
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(column);

		throwForbiddenIfFalse(this.boardNodeRule.can('createCard', user, boardNodeAuthorizable));

		const elements = requiredEmptyElements.map((type) => this.boardNodeFactory.buildContentElement(type));
		const card = this.boardNodeFactory.buildCard(elements);

		await this.boardNodeService.addToParent(column, card);

		return card;
	}

	public async moveCard(
		userId: EntityId,
		cardId: EntityId,
		toColumnId: EntityId,
		toPosition?: number
	): Promise<{ card: Card; fromBoard: ColumnBoard; toBoard: ColumnBoard; fromColumn: Column; toColumn: Column }> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		if (!card.parentId) {
			throw new UnprocessableEntityException('Card has no parent column');
		}
		const fromColumn = await this.boardNodeService.findByClassAndId(Column, card.parentId, 1);
		const toColumn = await this.boardNodeService.findByClassAndId(Column, toColumnId, 1);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(fromColumn);

		const fromBoard = await this.columnBoardService.findById(card.rootId, 0);
		const toBoard = await this.columnBoardService.findById(toColumn.rootId, 0);

		throwForbiddenIfFalse(this.boardNodeRule.can('moveCard', user, boardNodeAuthorizable));
		const isNotBoardContent = fromBoard.context.id !== toBoard.context.id;
		if (isNotBoardContent) {
			throwForbiddenIfFalse(this.boardNodeRule.can('relocateContent', user, boardNodeAuthorizable));
		}

		await this.boardNodeService.move(card, toColumn, toPosition);

		return { card, fromBoard, toBoard, fromColumn, toColumn };
	}

	public async copyCard(userId: EntityId, cardId: EntityId, schoolId: EntityId): Promise<Card> {
		const card = await this.boardNodeService.findByClassAndId(Card, cardId);
		if (!card.parentId) {
			throw new UnprocessableEntityException('Card has no parent column');
		}
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(card);

		throwForbiddenIfFalse(this.boardNodeRule.can('copyCard', user, boardNodeAuthorizable));

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
