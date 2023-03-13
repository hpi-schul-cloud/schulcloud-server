import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { ColumnBoardRepo } from '../repo';
import { ColumnRepo } from '../repo/column.repo';

@Injectable()
export class BoardUc {
	constructor(
		private readonly columnBoardRepo: ColumnBoardRepo,
		private readonly columnRepo: ColumnRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(BoardUc.name);
	}

	async findBoard(userId: EntityId, boardId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'findBoard', userId, boardId });

		// TODO check permissions
		const board = await this.columnBoardRepo.findById(boardId);
		return board;
	}

	async createBoard(userId: EntityId): Promise<ColumnBoard> {
		this.logger.debug({ action: 'createBoard', userId });

		// TODO check permissions

		const board = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			columns: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.columnBoardRepo.save(board);

		return board;
	}

	async createColumn(userId: EntityId, boardId: EntityId): Promise<Column> {
		this.logger.debug({ action: 'createColumn', userId, boardId });

		const board = await this.columnBoardRepo.findById(boardId);

		// TODO check permissions

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			cards: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		board.addColumn(column);

		await this.columnRepo.save(board.columns, board.id);

		return column;
	}
}
