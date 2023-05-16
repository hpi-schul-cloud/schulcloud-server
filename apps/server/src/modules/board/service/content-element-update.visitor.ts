import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
} from '@shared/domain';
import { FileContentBody, RichTextContentBody } from '../controller/dto';

type ContentType = RichTextContentBody | FileContentBody;

export class ContentElementUpdateVisitor implements BoardCompositeVisitor {
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

	visitRichTextElement(richTextElement: RichTextElement): void {
		if (this.content instanceof RichTextContentBody) {
			richTextElement.text = this.content.text;
		} else {
			this.throwNotHandled(richTextElement);
		}
	}

	visitFileElement(fileElement: FileElement): void {
		if (this.content instanceof FileContentBody) {
			fileElement.caption = this.content.caption;
		} else {
			this.throwNotHandled(fileElement);
		}
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot update element of type: '${component.constructor.name}'`);
	}
}
