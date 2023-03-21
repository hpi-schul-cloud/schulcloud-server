import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { ColumnBoardRepo, ColumnRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly columnBoardRepo: ColumnBoardRepo, private readonly columnRepo: ColumnRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.columnBoardRepo.findById(boardId);
		return board;
	}

	async createBoard(): Promise<ColumnBoard> {
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

	async createColumn(boardId: EntityId): Promise<Column> {
		const board = await this.columnBoardRepo.findById(boardId);

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
