import { Injectable } from '@nestjs/common';
import { Column, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { ColumnBoardRepo } from '../repo';
import { ColumnRepo } from '../repo/column.repo';

@Injectable()
export class ColumnUc {
	constructor(
		private readonly columnBoardRepo: ColumnBoardRepo,
		private readonly columnRepo: ColumnRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(ColumnUc.name);
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
