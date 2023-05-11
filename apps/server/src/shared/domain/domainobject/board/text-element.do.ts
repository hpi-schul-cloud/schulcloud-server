import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class TextElement extends BoardComposite<TextElementProps> {
	get text(): string {
		return this.props.text;
	}

	set text(value: string) {
		this.props.text = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitTextElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitTextElementAsync(this);
	}
}

export interface TextElementProps extends BoardCompositeProps {
	text: string;
}
