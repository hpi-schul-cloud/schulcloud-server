import { InputFormat } from '@shared/domain/types';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class RichTextElement extends BoardComposite<RichTextElementProps> {
	get text(): string {
		return this.props.text;
	}

	set text(value: string) {
		this.props.text = value;
	}

	get inputFormat(): InputFormat {
		return this.props.inputFormat;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitRichTextElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitRichTextElementAsync(this);
	}
}

export interface RichTextElementProps extends BoardCompositeProps {
	text: string;
	inputFormat: InputFormat;
}
