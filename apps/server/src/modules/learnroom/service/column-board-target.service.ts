import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ColumnBoardService } from '@modules/board';
import { Injectable } from '@nestjs/common';
import { ColumnBoardTarget } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class ColumnBoardTargetService {
	constructor(private readonly columnBoardService: ColumnBoardService, private readonly em: EntityManager) {}

	async findOrCreateTargets(columnBoardIds: EntityId[]): Promise<ColumnBoardTarget[]> {
		const existingTargets = await this.findExistingTargets(columnBoardIds);

		const titlesMap = await this.columnBoardService.getBoardObjectTitlesById(columnBoardIds);

		const columnBoardTargets = columnBoardIds.map((id) => {
			const title = titlesMap[id] ?? '';
			let target = existingTargets.find((item) => item.columnBoardId === id);
			if (target) {
				target.title = title;
			} else {
				target = new ColumnBoardTarget({ columnBoardId: id, title });
			}
			this.em.persist(target);
			return target;
		});

		await this.em.flush();

		return columnBoardTargets;
	}

	private async findExistingTargets(columnBoardIds: EntityId[]): Promise<ColumnBoardTarget[]> {
		const existingTargets = await this.em.find(ColumnBoardTarget, {
			_columnBoardId: { $in: columnBoardIds },
		} as unknown as FilterQuery<ColumnBoardTarget>);

		return existingTargets;
	}
}
