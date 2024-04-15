import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Utils } from '@mikro-orm/core';
import { BoardNodeEntity } from './entity/board-node.entity';
import { TreeBuilder } from './tree-builder';
import { joinPath } from '../domain/path-utils';
import { AnyBoardNode, AnyBoardNodeProps } from '../domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const props: AnyBoardNodeProps = await this.findOneOrFail(id);
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	// TODO: handle depth?
	public async findByIds(ids: EntityId[]): Promise<AnyBoardNode[]> {
		const props: AnyBoardNodeProps[] = await this.findMany(ids);

		const childrenMap = await this.findDescendantsOfMany(props);

		const domainObjects = props.map((prop) => {
			const children = childrenMap[joinPath(prop.path, prop.id)];
			const builder = new TreeBuilder(children);
			return builder.build(prop);
		});

		return domainObjects;
	}

	public persist(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			let props = this.getProps(bn);

			if (!(props instanceof BoardNodeEntity)) {
				props = this.em.create(BoardNodeEntity, props) as AnyBoardNodeProps;
				this.setProps(bn, props);
			}

			this.em.persist(props);
		});

		return this;
	}

	public async persistAndFlush(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		return this.persist(boardNode).flush();
	}

	public remove(boardNode: AnyBoardNode): BoardNodeRepo {
		this.em.remove(this.getProps(boardNode));

		return this;
	}

	public async removeAndFlush(boardNode: AnyBoardNode): Promise<void> {
		await this.em.removeAndFlush(this.getProps(boardNode));
	}

	public async flush(): Promise<void> {
		return this.em.flush();
	}

	private getProps(boardNode: AnyBoardNode): AnyBoardNodeProps {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = boardNode;
		return props;
	}

	private setProps(boardNode: AnyBoardNode, props: AnyBoardNodeProps): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		boardNode.props = props;
	}

	private async findDescendants(props: AnyBoardNodeProps, depth?: number): Promise<AnyBoardNodeProps[]> {
		const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };
		const pathOfChildren = joinPath(props.path, props.id);

		const descendants = await this.em.find(BoardNodeEntity, {
			path: { $re: `^${pathOfChildren}` },
			level: levelQuery,
		});

		return descendants as AnyBoardNodeProps[];
	}

	private async findDescendantsOfMany(props: AnyBoardNodeProps[]): Promise<Record<string, AnyBoardNodeProps[]>> {
		const pathQueries = props.map((prop) => {
			return { path: { $re: `^${joinPath(prop.path, prop.id)}` } };
		});

		const map: Record<string, AnyBoardNodeProps[]> = {};
		if (pathQueries.length === 0) {
			return map;
		}

		const descendants = (await this.em.find(BoardNodeEntity, {
			$or: pathQueries,
		})) as AnyBoardNodeProps[];

		// this is for finding tha ancestors of a descendant
		// we use this to group the descendants by ancestor
		// TODO we probably need a more efficient way to do the grouping
		const matchAncestors = (descendant: AnyBoardNodeProps): AnyBoardNodeProps[] => {
			const result = props.filter((n) => descendant.path.match(`^${n.path}`));
			return result;
		};

		for (const desc of descendants) {
			const ancestorNodes = matchAncestors(desc);
			ancestorNodes.forEach((node) => {
				map[node.path] ||= [];
				map[node.path].push(desc);
			});
		}
		return map;
	}

	private findOneOrFail(id: EntityId): Promise<AnyBoardNodeProps> {
		return this.em.findOneOrFail(BoardNodeEntity, id) as Promise<AnyBoardNodeProps>;
	}

	private findMany(ids: EntityId[]): Promise<AnyBoardNodeProps[]> {
		return this.em.find(BoardNodeEntity, { id: { $in: ids } }) as Promise<AnyBoardNodeProps[]>;
	}
}
