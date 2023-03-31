import { Injectable } from '@nestjs/common';
import { ColumnBoard, ColumnBoardNode, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo, BoardNodeRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		return board;
	}

	async create(): Promise<ColumnBoard> {
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

	async delete(boardId: EntityId): Promise<void> {
		// ensure the board exists and is really a board
		await this.boardNodeRepo.findById(ColumnBoardNode, boardId);
		await this.boardDoRepo.deleteById(boardId);
	}
}
