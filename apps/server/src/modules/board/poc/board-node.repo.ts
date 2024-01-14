import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Utils } from '@mikro-orm/core';
import { BoardNode, BoardNodeProps } from './board-node.do';
import { BoardNodeEntity } from './board-node.entity';
import { TreeBuilder } from './tree-builder';
import { joinPath } from './path-utils';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<BoardNode> {
		const props = await this.em.findOneOrFail(BoardNodeEntity, { id });
		const descendants = await this.findDescendants(props);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	persist(boardNode: BoardNode | BoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			let props = this.getProps(bn);

			if (!(props instanceof BoardNodeEntity)) {
				props = this.em.create(BoardNodeEntity, props);
				this.setProps(bn, props);
			}

			this.em.persist(props);
		});

		return this;
	}

	async persistAndFlush(boardNode: BoardNode | BoardNode[]): Promise<void> {
		return this.persist(boardNode).flush();
	}

	remove(boardNode: BoardNode): BoardNodeRepo {
		this.em.remove(this.getProps(boardNode));

		return this;
	}

	async removeAndFlush(boardNode: BoardNode): Promise<void> {
		await this.em.removeAndFlush(this.getProps(boardNode));
	}

	async flush(): Promise<void> {
		return this.em.flush();
	}

	private async findDescendants(props: BoardNodeProps, depth?: number): Promise<BoardNodeProps[]> {
		const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };
		const pathOfChildren = joinPath(props.path, props.id);

		const descendants = await this.em.find(BoardNodeEntity, {
			path: { $re: `^${pathOfChildren}` },
			level: levelQuery,
		});

		return descendants;
	}

	private getProps(boardNode: BoardNode): BoardNodeProps {
		// @ts-ignore
		const { props } = boardNode;
		return props;
	}

	private setProps(boardNode: BoardNode, props: BoardNodeProps): void {
		// @ts-ignore
		boardNode.props = props;
	}
}
