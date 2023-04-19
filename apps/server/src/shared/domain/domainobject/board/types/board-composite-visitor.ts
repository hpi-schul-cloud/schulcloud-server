import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { TextElement } from '../text-element.do';

export interface BoardCompositeVisitor {
	visitColumnBoard(columnBoard: ColumnBoard): void;
	visitColumn(column: Column): void;
	visitCard(card: Card): void;
	visitTextElement(textElement: TextElement): void;
}

export interface BoardCompositeVisitorAsync {
	visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void>;
	visitColumnAsync(column: Column): Promise<void>;
	visitCardAsync(card: Card): Promise<void>;
	visitTextElementAsync(textElement: TextElement): Promise<void>;
}
