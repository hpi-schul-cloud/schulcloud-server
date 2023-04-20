import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	BoardNode,
	Card,
	Column,
	ColumnBoard,
	TextElement,
} from '@shared/domain';

@Injectable()
export class RecursiveDeleteVisitor implements BoardCompositeVisitorAsync {
	constructor(private readonly em: EntityManager) {}

	async visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void> {
		this.deleteNode(columnBoard);
		await this.visitChildrenAsync(columnBoard);
	}

	async visitColumnAsync(column: Column): Promise<void> {
		this.deleteNode(column);
		await this.visitChildrenAsync(column);
	}

	async visitCardAsync(card: Card): Promise<void> {
		this.deleteNode(card);
		await this.visitChildrenAsync(card);
	}

	async visitTextElementAsync(textElement: TextElement): Promise<void> {
		this.deleteNode(textElement);
		await this.visitChildrenAsync(textElement);
	}

	deleteNode(domainObject: AnyBoardDo): void {
		const boardNode = this.em.getUnitOfWork().getById(BoardNode.name, domainObject.id);
		if (boardNode) {
			this.em.remove(boardNode);
		}
	}

	async visitChildrenAsync(domainObject: AnyBoardDo): Promise<void> {
		await Promise.all(domainObject.children.map(async (child) => child.acceptAsync(this)));
	}
}
