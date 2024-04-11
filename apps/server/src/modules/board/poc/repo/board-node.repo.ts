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

	async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const props = await this.em.findOneOrFail(BoardNodeEntity, { id });
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	// TODO findByIds()

	persist(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
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

	async persistAndFlush(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		return this.persist(boardNode).flush();
	}

	remove(boardNode: AnyBoardNode): BoardNodeRepo {
		this.em.remove(this.getProps(boardNode));

		return this;
	}

	async removeAndFlush(boardNode: AnyBoardNode): Promise<void> {
		await this.em.removeAndFlush(this.getProps(boardNode));
	}

	async flush(): Promise<void> {
		return this.em.flush();
	}

	private async findDescendants(props: AnyBoardNodeProps, depth?: number): Promise<AnyBoardNodeProps[]> {
		const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };
		const pathOfChildren = joinPath(props.path, props.id);

		const descendants = await this.em.find(BoardNodeEntity, {
			path: { $re: `^${pathOfChildren}` },
			level: levelQuery,
		});

		return descendants;
	}

	private getProps(boardNode: AnyBoardNode): AnyBoardNodeProps {
		// @ts-ignore
		const { props } = boardNode;
		return props;
	}

	private setProps(boardNode: AnyBoardNode, props: AnyBoardNodeProps): void {
		// @ts-ignore
		boardNode.props = props;
	}
}
