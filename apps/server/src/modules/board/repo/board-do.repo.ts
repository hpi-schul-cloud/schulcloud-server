import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { AnyBoardDo, BoardNode, EntityId } from '@shared/domain';
import { BoardNodeBuilderImpl } from './board-node.builder-impl';
import { BoardDoBuilderImpl } from './board-do.builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class BoardDoRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardDo> {
		const boardNode = await this.em.findOneOrFail(BoardNode, id);
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, depth);
		const domainObject = new BoardDoBuilderImpl(descendants).buildDomainObject(boardNode);

		return domainObject;
	}

	async findByIds(ids: EntityId[]): Promise<AnyBoardDo[]> {
		const boardNodes = await this.em.find(BoardNode, { id: { $in: ids } });

		const childrenMap = await this.boardNodeRepo.findChildrenOfMany(boardNodes);

		const domainObjects = boardNodes.map((boardNode) => {
			const children = childrenMap[boardNode.pathOfChildren];
			const domainObject = new BoardDoBuilderImpl(children).buildDomainObject(boardNode);
			return domainObject;
		});

		return domainObjects;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const boardNode = await this.em.findOneOrFail(BoardNode, childId);
		if (boardNode.parentId) {
			const parent = await this.em.findOneOrFail(BoardNode, boardNode.parentId);
			const descendants = await this.boardNodeRepo.findDescendants(parent);
			const domainObject = new BoardDoBuilderImpl(descendants).buildDomainObject(parent);
			return domainObject;
		}
		return undefined;
	}

	async save(domainObject: AnyBoardDo | AnyBoardDo[], parentId?: EntityId) {
		const getParent = async (id?: EntityId): Promise<BoardNode | undefined> =>
			id ? this.boardNodeRepo.findById(BoardNode, id) : undefined;

		const domainObjects = Utils.asArray(domainObject);
		const parentNode = await getParent(parentId);
		const builder = new BoardNodeBuilderImpl(parentNode);
		const boardNodes = builder.buildBoardNodes(domainObjects, parentNode?.id);
		await this.boardNodeRepo.save(boardNodes);
	}

	async deleteWithDescendants(id: EntityId): Promise<void> {
		const boardNode = await this.boardNodeRepo.findById(BoardNode, id);
		await this.boardNodeRepo.deleteWithDescendants(boardNode);
	}
}
