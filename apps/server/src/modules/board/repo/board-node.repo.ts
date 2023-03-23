import { EntityName, FilterQuery, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, EntityId } from '@shared/domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById<T extends BoardNode>(entityName: EntityName<T>, id: EntityId): Promise<T> {
		const boardNode = await this.em.findOneOrFail(entityName, id as FilterQuery<T>);

		return boardNode;
	}

	async findByIds<T extends BoardNode>(entityName: EntityName<T>, ids: EntityId[]): Promise<T[]> {
		const boardNodes = await this.em.find(entityName, { id: { $in: ids } } as FilterQuery<T>);
		return boardNodes;
	}

	async findDescendants(node: BoardNode, depth?: number): Promise<BoardNode[]> {
		const levelQuery = depth !== undefined ? { $gt: node.level, $lte: node.level + depth } : { $gt: node.level };

		const descendants = await this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
			level: levelQuery,
		});

		return descendants;
	}

	async findChildrenOfMany(nodes: BoardNode[]): Promise<Record<string, BoardNode[]>> {
		const paths = nodes.map((node) => node.pathOfChildren);
		const children = await this.em.find(BoardNode, { path: { $in: paths } });

		const map: Record<string, BoardNode[]> = {};
		for (const child of children) {
			map[child.path] ||= [];
			map[child.path].push(child);
		}
		return map;
	}

	async save(boardNode: BoardNode | BoardNode[]) {
		const boardNodes = Utils.asArray(boardNode);

		// fill identity map with existing board nodes
		const boardNodeIds = boardNodes.map((bn) => bn.id);
		const existingNodes = await this.em.find(BoardNode, { id: { $in: boardNodeIds } });
		const nodeCache = new Map<EntityId, BoardNode>(existingNodes.map((node) => [node.id, node]));

		boardNodes.forEach((node) => {
			const existing = nodeCache.get(node.id);
			if (existing) {
				this.em.assign(existing, node);
			} else {
				this.em.create(BoardNode, node, { managed: true, persist: true });
			}
		});

		await this.em.flush();
	}

	async deleteWithDescendants(boardNode: BoardNode) {
		const descendants = await this.findDescendants(boardNode);
		await this.em.removeAndFlush([boardNode, ...descendants]);
	}

	// TODO. findDescendantsOfMany
}
