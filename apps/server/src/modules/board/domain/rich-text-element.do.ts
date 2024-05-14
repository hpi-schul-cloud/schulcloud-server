import { InputFormat } from '@shared/domain/types';
import { BoardNode } from './board-node.do';
import type { RichTextElementProps } from './types';

export class RichTextElement extends BoardNode<RichTextElementProps> {
	get text(): string {
		return this.props.text;
	}

	set text(value: string) {
		this.props.text = value;
	}

	get inputFormat(): InputFormat {
		return this.props.inputFormat;
	}

	set inputFormat(value: InputFormat) {
		this.props.inputFormat = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isRichTextElement = (reference: unknown): reference is RichTextElement =>
	reference instanceof RichTextElement;
