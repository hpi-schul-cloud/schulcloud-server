import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(columnId: EntityId): Promise<Column> {
		const column = await this.boardDoRepo.findByClassAndId(Column, columnId);
		return column;
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

		await this.boardDoRepo.save(parent.children, parent);

		return column;
	}

	async delete(column: Column): Promise<void> {
		await this.boardDoService.deleteWithDescendants(column);
	}

	async move(column: Column, targetBoard: ColumnBoard, targetPosition?: number): Promise<void> {
		await this.boardDoService.move(column, targetBoard, targetPosition);
	}

	async updateTitle(column: Column, title: string): Promise<void> {
		const parent = await this.boardDoRepo.findParentOfId(column.id);
		column.title = title;
		await this.boardDoRepo.save(column, parent);
	}
}
