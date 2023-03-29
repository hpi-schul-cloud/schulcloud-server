import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ColumnService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async create(boardId: EntityId): Promise<Column> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		board.addChild(column);

		await this.boardDoRepo.save(board.children, board.id);

		return column;
	}

	async deleteById(columnId: EntityId): Promise<void> {
		await this.boardDoRepo.deleteByClassAndId(Column, columnId);
	}
}
