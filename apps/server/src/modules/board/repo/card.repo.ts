import { Utils } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Card, CardNode, ColumnNode, EntityId } from '@shared/domain';
import { BoardDoBuilder } from '@shared/domain/entity/boardnode/board-do.builder';
import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class CardRepo {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(boardId: EntityId): Promise<Card> {
		const boardNode = await this.boardNodeRepo.findById(CardNode, boardId);
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, 2);
		const domainObject = new BoardDoBuilder(descendants).buildCard(boardNode);

		return domainObject;
	}

	async findByIds(ids: EntityId[]): Promise<Card[]> {
		const boardNodes = await this.boardNodeRepo.findByIds(CardNode, ids);

		const childrenMap = await this.boardNodeRepo.findChildrenOfMany(boardNodes);

		const domainObjects = boardNodes.map((boardNode) => {
			const children = childrenMap[boardNode.pathOfChildren];
			const domainObject = new BoardDoBuilder(children).buildCard(boardNode);
			return domainObject;
		});

		return domainObjects;
	}

	async save(card: Card | Card[], parentId: EntityId) {
		const cards = Utils.asArray(card);
		const parent = await this.boardNodeRepo.findById(ColumnNode, parentId);
		const builder = new BoardNodeBuilderImpl(parent);
		const cardNodes = builder.buildBoardNodes(cards, parent.id);
		await this.boardNodeRepo.save(cardNodes);
	}
}
