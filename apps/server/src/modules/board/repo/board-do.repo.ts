import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AnyBoardDo, BoardNode, EntityId } from '@shared/domain';
import { BoardDoBuilderImpl } from './board-do.builder-impl';
import { BoardNodeRepo } from './board-node.repo';
import { RecursiveDeleteVisitor } from './recursive-delete.vistor';
import { RecursiveSaveVisitor } from './recursive-save.visitor';

@Injectable()
export class BoardDoRepo {
	constructor(
		private readonly em: EntityManager,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly deleteVisitor: RecursiveDeleteVisitor
	) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardDo> {
		const boardNode = await this.em.findOneOrFail(BoardNode, id);
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, depth);
		const domainObject = new BoardDoBuilderImpl(descendants).buildDomainObject(boardNode);

		return domainObject;
	}

	async findByClassAndId<S, T extends AnyBoardDo>(
		doClass: { new (props: S): T },
		id: EntityId,
		depth?: number
	): Promise<T> {
		const domainObject = await this.findById(id, depth);
		if (!(domainObject instanceof doClass)) {
			throw new NotFoundException(`There is no '${doClass.name}' with this id`);
		}

		return domainObject;
	}

	async findByIds(ids: EntityId[]): Promise<AnyBoardDo[]> {
		const boardNodes = await this.em.find(BoardNode, { id: { $in: ids } });

		const childrenMap = await this.boardNodeRepo.findDescendantsOfMany(boardNodes);

		const domainObjects = boardNodes.map((boardNode) => {
			const children = childrenMap[boardNode.pathOfChildren];
			const domainObject = new BoardDoBuilderImpl(children).buildDomainObject(boardNode);
			return domainObject;
		});

		return domainObjects;
	}

	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const boardNode = await this.em.findOneOrFail(BoardNode, childId);
		const domainObject = boardNode.parentId ? this.findById(boardNode.parentId) : undefined;

		return domainObject;
	}

	async getAncestorIds(boardDo: AnyBoardDo): Promise<EntityId[]> {
		const boardNode = await this.em.findOneOrFail(BoardNode, boardDo.id);
		return boardNode.ancestorIds;
	}

	async save(domainObject: AnyBoardDo | AnyBoardDo[], parent?: AnyBoardDo): Promise<void> {
		const saveVisitor = new RecursiveSaveVisitor(this.em);
		await saveVisitor.save(domainObject, parent);
		await this.em.flush();
	}

	async delete(domainObject: AnyBoardDo): Promise<void> {
		await domainObject.acceptAsync(this.deleteVisitor);
		await this.em.flush();
	}
}
