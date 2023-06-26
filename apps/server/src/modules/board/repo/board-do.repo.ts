import { Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AnyBoardDo, BoardExternalReference, BoardNode, ColumnBoardNode, EntityId } from '@shared/domain';
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
		const boardNode = await this.boardNodeRepo.findById(id);
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

	async getTitleById(id: EntityId[] | EntityId): Promise<Record<EntityId, string>> {
		const ids = Utils.asArray(id);
		const boardNodes = await this.em.find(BoardNode, { id: { $in: ids } });

		const titlesMap = boardNodes.reduce((map, node) => {
			map[node.id] = node.title ?? '';
			return map;
		}, {});

		return titlesMap;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const boardNodes = await this.em.find(ColumnBoardNode, {
			_contextId: new ObjectId(reference.id),
			_contextType: reference.type,
		});
		const ids = boardNodes.map((o) => o.id);

		return ids;
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

	async save(domainObject: AnyBoardDo | AnyBoardDo[], parent?: AnyBoardDo): Promise<void> {
		const saveVisitor = new RecursiveSaveVisitor(this.em, this.boardNodeRepo);
		await saveVisitor.save(domainObject, parent);
		await this.em.flush();
	}

	async delete(domainObject: AnyBoardDo): Promise<void> {
		await domainObject.acceptAsync(this.deleteVisitor);
		await this.em.flush();
	}
}
