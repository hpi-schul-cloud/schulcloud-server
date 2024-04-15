import { InputFormat } from '@shared/domain/types';
import { BoardNode } from './board-node.do';
import { RichTextElementProps } from './types';

export class RichTextElement extends BoardNode<RichTextElementProps> {
	get text(): string {
		return this.props.text;
	}

	set text(text: string) {
		this.props.text = text;
	}

	get inputFormat(): InputFormat {
		return this.props.inputFormat;
	}

	set inputFormat(inputFormat: InputFormat) {
		this.props.inputFormat = inputFormat;
	}
}
