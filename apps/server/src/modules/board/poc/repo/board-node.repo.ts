import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, BoardExternalReference, getBoardNodeType } from '../domain';
import { pathOfChildren, ROOT_PATH } from '../domain/path-utils';
import { BoardNodeEntity } from './entity/board-node.entity';
import { TreeBuilder } from './tree-builder';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const props = await this.em.findOneOrFail(BoardNodeEntity, { id });
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	async findByIds(ids: EntityId[], depth?: number): Promise<AnyBoardNode[]> {
		const entities = await this.em.find(BoardNodeEntity, { id: { $in: ids } });

		const descendantsMap = await this.findDescendantsOfMany(entities, depth);

		const boardNodes = entities.map((props) => {
			const children = descendantsMap[pathOfChildren(props)];
			const builder = new TreeBuilder(children);
			const boardNode = builder.build(props);

			return boardNode;
		});

		return boardNodes;
	}

	async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<AnyBoardNode[]> {
		const entities = await this.em.find(BoardNodeEntity, {
			_context: { id: reference.id, type: reference.type },
		});

		// TODO refactor descendants mapping
		const descendantsMap = await this.findDescendantsOfMany(entities, depth);

		const boardNodes = entities.map((props) => {
			const children = descendantsMap[pathOfChildren(props)];
			const builder = new TreeBuilder(children);
			const boardNode = builder.build(props);

			return boardNode;
		});

		return boardNodes;
	}

	// TODO maybe we don't need that method
	async findCommonParentOfIds(ids: EntityId[], depth?: number): Promise<AnyBoardNode> {
		const entities = await this.em.find(BoardNodeEntity, { id: { $in: ids } });
		const sortedPaths = entities.map((e) => e.path).sort();
		const commonPath = sortedPaths[0];
		const dontMatch = sortedPaths.some((p) => !p.startsWith(commonPath));

		if (!commonPath || commonPath === ROOT_PATH || dontMatch) {
			throw new EntityNotFoundError(`Parent node of [${ids.join(',')}] not found`);
		}

		const commonAncestorIds = commonPath.split(',').filter((id) => id !== '');
		const parentId = commonAncestorIds[commonAncestorIds.length - 1];
		const parentNode = await this.findById(parentId, depth);

		return parentNode;
	}

	persist(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			bn.children.forEach((child) => this.persist(child));

			const props = this.getProps(bn);

			if (!(props instanceof BoardNodeEntity)) {
				const entity = this.em.create(BoardNodeEntity, props);
				entity.type = getBoardNodeType(bn);
				this.setProps(bn, entity);
				this.em.persist(entity);
			} else {
				// for the unlikely case that the props are not managed yet
				this.em.persist(props);
			}
		});

		return this;
	}

	async persistAndFlush(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		return this.persist(boardNode).flush();
	}

	remove(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			this.em.remove(this.getProps(bn));
			bn.children.forEach((child) => this.remove(child));
		});

		return this;
	}

	async removeAndFlush(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		await this.remove(boardNode).flush();
	}

	async flush(): Promise<void> {
		return this.em.flush();
	}

	private async findDescendants(props: BoardNodeEntity, depth?: number): Promise<BoardNodeEntity[]> {
		const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };

		const descendants = await this.em.find(BoardNodeEntity, {
			path: { $re: `^${pathOfChildren(props)}` },
			level: levelQuery,
		});

		return descendants;
	}

	private async findDescendantsOfMany(
		entities: BoardNodeEntity[],
		depth?: number
	): Promise<Record<string, BoardNodeEntity[]>> {
		const pathQueries = entities.map((props) => {
			const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };

			return { path: { $re: `^${pathOfChildren(props)}` }, level: levelQuery };
		});

		const map: Record<string, BoardNodeEntity[]> = {};
		if (pathQueries.length === 0) {
			return map;
		}

		const descendants = await this.em.find(BoardNodeEntity, {
			$or: pathQueries,
		});

		// this is for finding the ancestors of a descendant
		// we use this to group the descendants by ancestor
		// TODO we probably need a more efficient way to do the grouping
		const matchAncestors = (descendant: BoardNodeEntity): BoardNodeEntity[] => {
			const result = entities.filter((props) => descendant.path.match(`^${pathOfChildren(props)}`));
			return result;
		};

		for (const desc of descendants) {
			const ancestors = matchAncestors(desc);
			ancestors.forEach((props) => {
				map[pathOfChildren(props)] ||= [];
				map[pathOfChildren(props)].push(desc);
			});
		}
		return map;
	}

	private getProps(boardNode: AnyBoardNode): BoardNodeEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = boardNode;
		return props as BoardNodeEntity;
	}

	private setProps(boardNode: AnyBoardNode, props: BoardNodeEntity): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		boardNode.props = props;
	}
}
