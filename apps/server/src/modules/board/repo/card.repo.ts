import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, Card, CardNode, EntityId } from '@shared/domain';
import { BoardDoBuilder } from '@shared/domain/entity/boardnode/board-do.builder';
import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class CardRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(boardId: EntityId): Promise<Card> {
		const boardNode = await this.em.findOneOrFail(CardNode, { id: boardId });
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, 2);
		const domainObject = new BoardDoBuilder(descendants).buildCard(boardNode);

		return domainObject;
	}

	async findByIds(ids: EntityId[]): Promise<Card[]> {
		const boardNodes = await this.em.find(CardNode, { id: { $in: ids } });

		const childrenMap = await this.boardNodeRepo.findChildrenOfMany(boardNodes);

		const domainObjects = boardNodes.map((boardNode) => {
			const children = childrenMap[boardNode.pathOfChildren];
			const domainObject = new BoardDoBuilder(children).buildCard(boardNode);
			return domainObject;
		});

		return domainObjects;
	}

	async saveCard(card: Card, parentId: EntityId[]) {
		const builder = new BoardNodeBuilderImpl();
		const parent = await this.em.findOneOrFail(BoardNode, { id: parentId });
		const cardNode = builder.buildCardNode(card, parent);
		await this.boardNodeRepo.save(cardNode);
	}
}
