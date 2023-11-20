import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId, PermissionContextEntity } from '@shared/domain';
import { ObjectId } from 'bson';
import { PermissionContextRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly permissionCtxRepo: PermissionContextRepo
	) {}

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

		const parentContext = await this.permissionCtxRepo.findByContextReference(parent.id);
		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Column permission context',
			parentContext,
			contextReference: new ObjectId(column.id),
		});
		await this.permissionCtxRepo.save(permissionCtxEntity);

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
