import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Column, ColumnBoardNode, EntityId } from '@shared/domain';
import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class ColumnRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async save(column: Column | Column[], parentId: EntityId) {
		const columns = Utils.asArray(column);
		const parent = await this.boardNodeRepo.findById(ColumnBoardNode, parentId);
		const builder = new BoardNodeBuilderImpl(parent);
		const columnNodes = builder.buildBoardNodes(columns, parent.id);
		await this.boardNodeRepo.save(columnNodes);
	}
}
