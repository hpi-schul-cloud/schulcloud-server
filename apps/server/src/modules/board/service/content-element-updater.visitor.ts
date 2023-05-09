import { AnyBoardDo, BoardCompositeVisitor, Card, Column, ColumnBoard, FileElement, TextElement } from '@shared/domain';
import { FileElementContent, TextElementContent } from '../controller/dto';

type ContentType = TextElementContent | FileElementContent;

export class ContentElementUpdaterVisitor implements BoardCompositeVisitor {
	private readonly content: ContentType;

	constructor(content: ContentType) {
		this.content = content;
	}

	visitColumnBoard(columnBoard: ColumnBoard): void {
		this.throwNotHandled(columnBoard);
	}

	visitColumn(column: Column): void {
		this.throwNotHandled(column);
	}

	visitCard(card: Card): void {
		this.throwNotHandled(card);
	}

	visitTextElement(textElement: TextElement): void {
		textElement.text = (this.content as TextElementContent).text;
	}

	visitFileElement(fileElement: FileElement): void {
		fileElement.caption = (this.content as FileElementContent).caption;
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Unknown element type for update: '${component.constructor.name}'`);
	}
}
