import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

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

	async deleteById(boardId: EntityId): Promise<void> {
		await this.boardDoRepo.deleteByClassAndId(ColumnBoard, boardId);
	}
}
