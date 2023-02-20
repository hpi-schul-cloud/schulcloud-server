import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class ColumnBoardRepo extends BaseRepo<ColumnBoard> {
	get entityName() {
		return ColumnBoard;
	}

	async findById(id: EntityId): Promise<ColumnBoard> {
		const board = await this._em.findOneOrFail(ColumnBoard, { id });
		return board;
	}
}
