import { Injectable } from '@nestjs/common';
import { AnyBoardDo, BoardCompositeVisitorAsync, Card, Column, ColumnBoard, TextElement } from '@shared/domain';

@Injectable()
export class DeleteHookService implements BoardCompositeVisitorAsync {
	async visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void> {
		await this.visitChildren(columnBoard);
	}

	async visitColumnAsync(column: Column): Promise<void> {
		await this.visitChildren(column);
	}

	async visitCardAsync(card: Card): Promise<void> {
		await this.visitChildren(card);
	}

	async visitTextElementAsync(textElement: TextElement): Promise<void> {
		await this.visitChildren(textElement);
	}

	async visitChildren(domainObject: AnyBoardDo): Promise<void> {
		await Promise.all(domainObject.children.map(async (child) => child.acceptAsync(this)));
	}
}
