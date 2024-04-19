import { type FilterQuery, Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import type { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AnyBoardDo, BoardExternalReference } from '@shared/domain/domainobject';
import { BoardNode, ExternalToolElementNodeEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
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

	// TODO add depth parameter
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

	// TODO replace by service using findByIds(ids, depth = 1)
	async getTitlesByIds(id: EntityId[] | EntityId): Promise<Record<EntityId, string>> {
		const ids = Utils.asArray(id);
		const boardNodes = await this.em.find(BoardNode, { id: { $in: ids } });

		const titlesMap = boardNodes.reduce((map, node) => {
			map[node.id] = node.title ?? '';
			return map;
		}, {});

		return titlesMap;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
		const boardNodes: BoardNode[] = await this.em.find(BoardNode, {
			_contextId: new ObjectId(reference.id),
			_contextType: reference.type,
		} as FilterQuery<BoardNode>);

		const ids: EntityId[] = boardNodes.map((node) => node.id);

		return ids;
	}

	// TODO replace by findById => getParentId => findById
	async findParentOfId(childId: EntityId): Promise<AnyBoardDo | undefined> {
		const boardNode = await this.boardNodeRepo.findById(childId);
		const domainObject = boardNode.parentId ? this.findById(boardNode.parentId) : undefined;

		return domainObject;
	}

	// ???
	async countBoardUsageForExternalTools(contextExternalTools: ContextExternalTool[]) {
		const toolIds: EntityId[] = contextExternalTools
			.map((tool: ContextExternalTool): EntityId | undefined => tool.id)
			.filter((id: EntityId | undefined): id is EntityId => !!id);

		const boardNodes: ExternalToolElementNodeEntity[] = await this.em.find(ExternalToolElementNodeEntity, {
			contextExternalTool: { $in: toolIds },
		});

		const boardIds: EntityId[] = boardNodes.map((node: ExternalToolElementNodeEntity): EntityId => node.ancestorIds[0]);
		const boardCount: number = new Set(boardIds).size;

		return boardCount;
	}

	// TODO remove
	async getAncestorIds(boardDo: AnyBoardDo): Promise<EntityId[]> {
		const boardNode = await this.boardNodeRepo.findById(boardDo.id);
		return boardNode.ancestorIds;
	}

	// TODO replace by persist + flush
	async save(domainObject: AnyBoardDo | AnyBoardDo[], parent?: AnyBoardDo): Promise<void> {
		const saveVisitor = new RecursiveSaveVisitor(this.em, this.boardNodeRepo);
		await saveVisitor.save(domainObject, parent);
		await this.em.flush();
	}

	// TODO re-implement as recursive em.delete()
	// TODO find out how to implement delete hooks
	// suggestion:
	// service.delete(column):
	// 	- find parent board
	// 	- board.removeChild(column)
	// 	- repo.deleteRecursive(column)
	//  - repo.flush
	// 	- recurse column, execute hooks (TreeWalker?)
	async delete(domainObject: AnyBoardDo): Promise<void> {
		await domainObject.acceptAsync(this.deleteVisitor);
		await this.em.flush();
	}

	// TODO re-implement as finByExternalReference
	// suggestion
	// service.deleteByExternalReference(reference):
	// - board = repo.findByExternalReference
	// - repo.deleteRecursive(board)
	// - repo.flush
	// - recurse board, execute hooks
	async deleteByExternalReference(reference: BoardExternalReference): Promise<number> {
		// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
		const boardNodes: BoardNode[] = await this.em.find(BoardNode, {
			_contextId: new ObjectId(reference.id),
			_contextType: reference.type,
		} as FilterQuery<BoardNode>);

		const boardDeletionPromises: Promise<void>[] = boardNodes.map(async (boardNode: BoardNode): Promise<void> => {
			const descendants: BoardNode[] = await this.boardNodeRepo.findDescendants(boardNode);

			const domainObject: AnyBoardDo = new BoardDoBuilderImpl(descendants).buildDomainObject(boardNode);

			await domainObject.acceptAsync(this.deleteVisitor);
		});

		await Promise.all(boardDeletionPromises);

		await this.em.flush();

		return boardNodes.length;
	}
}
