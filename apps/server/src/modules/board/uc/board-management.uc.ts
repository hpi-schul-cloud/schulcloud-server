import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';
import { boardNodeFactory, cardPayloadFactory, textElementPayloadFactory } from '@shared/testing';

@Injectable()
export class BoardManagementUc {
	constructor(private em: EntityManager) {}

	async createBoards(): Promise<void> {
		const board = boardNodeFactory.asBoard().build();
		await this.em.persistAndFlush(board);

		const columns = boardNodeFactory.asColumn().buildList(6, { parent: board });
		await this.em.persistAndFlush(columns);

		const columnCards = columns.map((column) => {
			const cards: BoardNode[] = [];
			for (let i = 0; i < this.generateRandomNumber(5, 10); i += 1) {
				const node = boardNodeFactory
					.asCard()
					.build({ parent: column, payload: cardPayloadFactory.build({ height: this.generateRandomNumber(50, 250) }) });
				cards.push(node);
			}
			return cards;
		});

		const cards = ([] as BoardNode[]).concat(...columnCards);
		await this.em.persistAndFlush(cards);

		const cardElements = cards.map((card, i) => {
			const elements: BoardNode[] = [];
			for (let j = 0; j < this.generateRandomNumber(5, 10); j += 1) {
				const node = boardNodeFactory
					.asTextElement()
					.build({ parent: card, payload: textElementPayloadFactory.build({ text: `<p>text ${j + 1}</p>` }) });
				elements.push(node);
			}
			return elements;
		});
		const elements = ([] as BoardNode[]).concat(...cardElements);
		await this.em.persistAndFlush(elements);
	}

	private generateRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max + min - 1) + min);
	}
}
