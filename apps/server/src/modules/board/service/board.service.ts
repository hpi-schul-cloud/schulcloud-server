import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { ColumnBoardRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly columnBoardRepo: ColumnBoardRepo) {}

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
}
