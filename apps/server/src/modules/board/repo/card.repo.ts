import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, BoardNodeType, Card, EntityId } from '@shared/domain';
import { AnyBoardDoBuilder } from '../mapper';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class CardRepo {
	constructor(
		private readonly em: EntityManager,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly domainObjectBuilder: AnyBoardDoBuilder
	) {}

	async findById(boardId: EntityId): Promise<Card> {
		const boardNode = await this.em.findOneOrFail(BoardNode, { id: boardId, type: BoardNodeType.CARD });
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, 2);
		const domainObject = this.domainObjectBuilder.buildTree(boardNode, descendants);

		return domainObject as Card;
	}

	// TODO findManyByIds()
}
