import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';
import { boardNodeFactory, cardPayloadFactory } from '@shared/testing';

@Injectable()
export class BoardManagementUc {
	constructor(private em: EntityManager) {}

	async createBoards(): Promise<void> {
		const board = boardNodeFactory.asBoard().build();
		await this.em.persistAndFlush(board);

		const columns = boardNodeFactory.asColumn().buildList(6, { parent: board });
		await this.em.persistAndFlush(columns);

		const columnCards = columns.map((column) => {
			const buildCard = () =>
				boardNodeFactory
					.asCard()
					.build({ parent: column, payload: cardPayloadFactory.build({ height: this.generateRandomNumber(50, 250) }) });
			return Array<BoardNode>(this.generateRandomNumber(5, 10)).fill(buildCard());
		});

		const cards = ([] as BoardNode[]).concat(...columnCards);
		await this.em.persistAndFlush(cards);

		const cardElements = cards.map((card) =>
			boardNodeFactory.asTextElement().buildList(this.generateRandomNumber(2, 8), { parent: card })
		);
		const elements = ([] as BoardNode[]).concat(...cardElements);
		await this.em.persistAndFlush(elements);
	}

	private generateRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max + min - 1) + min);
	}
}
