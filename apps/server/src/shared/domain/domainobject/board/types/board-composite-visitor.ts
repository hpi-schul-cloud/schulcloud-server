import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';

export interface BoardCompositeVisitor {
	visitColumnBoard(columnBoard: ColumnBoard): void;
	visitColumn(column: Column): void;
	visitCard(card: Card): void;
	visitRichTextElement(richTextElement: RichTextElement): void;
	visitFileElement(fileElement: FileElement): void;
}

export interface BoardCompositeVisitorAsync {
	visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void>;
	visitColumnAsync(column: Column): Promise<void>;
	visitCardAsync(card: Card): Promise<void>;
	visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void>;
	visitFileElementAsync(fileElement: FileElement): Promise<void>;
}
