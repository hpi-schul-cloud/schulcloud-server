import { Injectable } from '@nestjs/common';
import { Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { CourseRepo, PermissionContextRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { BaseService } from './base.service';

@Injectable()
export class ColumnService extends BaseService {
	constructor(
		protected readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		protected readonly permissionCtxRepo: PermissionContextRepo,
		protected readonly courseRepo: CourseRepo
	) {
		super(permissionCtxRepo, boardDoRepo, courseRepo);
	}

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

		await this.createBoardPermissionCtx(column.id, parent.id, 'Column permission context');

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
