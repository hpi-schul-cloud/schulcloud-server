import { BoardNode } from './board-node.do';
import type { FileFolderElementProps } from './types';

export class FileFolderElement extends BoardNode<FileFolderElementProps> {
	get title(): string {
		return this.props.title || '';
	}

	set title(value: string) {
		this.props.title = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isFileFolderElement = (reference: unknown): reference is FileFolderElement =>
	reference instanceof FileFolderElement;
