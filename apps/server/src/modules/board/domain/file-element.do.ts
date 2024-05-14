import { BoardNode } from './board-node.do';
import type { FileElementProps } from './types';

export class FileElement extends BoardNode<FileElementProps> {
	get alternativeText(): string {
		return this.props.alternativeText || '';
	}

	set alternativeText(value: string) {
		this.props.alternativeText = value;
	}

	get caption(): string {
		return this.props.caption || '';
	}

	set caption(value: string) {
		this.props.caption = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isFileElement = (reference: unknown): reference is FileElement => reference instanceof FileElement;
