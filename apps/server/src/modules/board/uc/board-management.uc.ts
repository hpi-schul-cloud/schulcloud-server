import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';
import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';

@Injectable()
export class BoardManagementUc {
	constructor(private em: EntityManager) {}

	async createBoards(): Promise<void> {
		const board = boardNodeFactory.asBoard().build();
		await this.em.persistAndFlush(board);

		const columns = boardNodeFactory.asColumn().buildList(3, { parent: board });
		await this.em.persistAndFlush(columns);

		const columnCards = columns.map((column) =>
			boardNodeFactory.asCard().buildList(this.generateRandomNumber(1, 3), { parent: column })
		);
		const cards = ([] as BoardNode[]).concat(...columnCards);
		await this.em.persistAndFlush(cards);

		const cardElements = cards.map((card) =>
			boardNodeFactory.asElement().buildList(this.generateRandomNumber(1, 5), { parent: card })
		);
		const elements = ([] as BoardNode[]).concat(...cardElements);
		await this.em.persistAndFlush(elements);
	}

	private generateRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max + min - 1) + min);
	}
}
