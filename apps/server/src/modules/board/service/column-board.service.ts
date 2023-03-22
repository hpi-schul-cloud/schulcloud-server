import { Injectable, NotFoundException } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findById(boardId);
		if (board instanceof ColumnBoard) {
			return board;
		}
		throw new NotFoundException('there is no columboard with this id');
	}

	async createBoard(): Promise<ColumnBoard> {
		const board = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.boardDoRepo.save(board);

		return board;
	}

	async createColumn(boardId: EntityId): Promise<Column> {
		const board = (await this.boardDoRepo.findById(boardId)) as ColumnBoard;

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		board.addColumn(column);

		await this.boardDoRepo.save(board.children, board.id);

		return column;
	}
}
