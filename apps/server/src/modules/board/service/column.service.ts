import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(cardId: EntityId): Promise<Column> {
		const card = await this.boardDoRepo.findByClassAndId(Column, cardId);
		return card;
	}

	async create(parent: ColumnBoard): Promise<Column> {
		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		parent.addChild(column);

		await this.boardDoRepo.save(parent.children, parent.id);

		return column;
	}

	async delete(parent: ColumnBoard, columnId: EntityId): Promise<void> {
		await this.boardDoService.deleteChildWithDescendants(parent, columnId);
	}

	async move(columnId: EntityId, boardId: EntityId, toIndex: number): Promise<void> {
		await this.boardDoService.moveBoardDo(columnId, boardId, toIndex);
	}
}
