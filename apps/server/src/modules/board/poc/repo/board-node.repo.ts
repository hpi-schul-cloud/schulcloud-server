import { RequiredEntityData, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNodeType } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, AnyBoardNodeProps, Card, Column, ColumnBoard } from '../domain';
import { joinPath } from '../domain/path-utils';
import { BoardNodeEntity } from './entity/board-node.entity';
import { TreeBuilder } from './tree-builder';

type AnyBoardNodeType = `${BoardNodeType}`;
type BoardNodeTypeToClass<T extends AnyBoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
	? ColumnBoard
	: T extends BoardNodeType.COLUMN
	? Column
	: T extends BoardNodeType.CARD
	? Card
	: never;

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const props = (await this.em.findOneOrFail(BoardNodeEntity, { id })) as AnyBoardNodeProps;
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	async findByIdAndType<T extends AnyBoardNodeType>(
		id: EntityId,
		type: T,
		depth?: number
	): Promise<BoardNodeTypeToClass<T>> {
		const props = (await this.em.findOneOrFail(BoardNodeEntity, { id, type })) as AnyBoardNodeProps;
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode as BoardNodeTypeToClass<T>;
	}

	// TODO findByIds()

	persist(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			bn.children.forEach((child) => this.persist(child));

			const props = this.getProps(bn);

			if (!(props instanceof BoardNodeEntity)) {
				const entity = this.em.create(BoardNodeEntity, props as RequiredEntityData<BoardNodeEntity>);
				this.setProps(bn, entity as AnyBoardNodeProps);
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

		return descendants as AnyBoardNodeProps[];
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
