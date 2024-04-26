import { BoardNode } from './board-node.do';
import { InputFormat, RichTextElementProps } from './types';

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

	canChildBeAdded(): boolean {
		return false;
	}
}
