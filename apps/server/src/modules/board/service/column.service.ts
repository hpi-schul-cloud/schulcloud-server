import { Injectable } from '@nestjs/common';
import { BoardCompositeProps, Column, ColumnBoard, ColumnProps } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
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

	async createMany(parent: ColumnBoard, props: Omit<ColumnProps, keyof BoardCompositeProps>[]): Promise<Column[]> {
		const columns = props.map((prop) => {
			const column = new Column({
				id: new ObjectId().toHexString(),
				title: prop.title,
				children: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			parent.addChild(column);

			return column;
		});

		await this.boardDoRepo.save(parent.children, parent);

		return columns;
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
