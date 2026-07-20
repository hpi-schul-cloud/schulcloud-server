import { BoardNode } from './board-node.do';
import type { FileFolderElementProps } from './types/board-node-props';

export class FileFolderElement extends BoardNode<FileFolderElementProps> {
	get title(): string {
		return this.props.title || '';
	}

	set title(value: string) {
		this.props.title = value;
	}

	public canHaveChild(): boolean {
		return false;
	}
}

export const isFileFolderElement = (reference: unknown): reference is FileFolderElement =>
	reference instanceof FileFolderElement;
