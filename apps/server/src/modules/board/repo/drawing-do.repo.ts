import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardDoBuilderImpl } from './board-do.builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class DrawingDoRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardDo> {
		const boardNode = await this.boardNodeRepo.findById(id);
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, depth);
		const domainObject = new BoardDoBuilderImpl(descendants).buildDomainObject(boardNode);

		return domainObject;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const boardNode = await this.boardNodeRepo.findById(childId);
		const domainObject = boardNode.parentId ? this.findById(boardNode.parentId) : undefined;

		return domainObject;
	}

	async getAncestorIds(boardDo: AnyBoardDo): Promise<EntityId[]> {
		const boardNode = await this.boardNodeRepo.findById(boardDo.id);
		return boardNode.ancestorIds;
	}
}
