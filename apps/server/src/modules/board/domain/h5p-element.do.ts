import { BoardNode } from './board-node.do';
import type { H5pElementProps } from './types';

export class H5pElement extends BoardNode<H5pElementProps> {
	get contentId(): string | undefined {
		return this.props.contentId;
	}

	set contentId(value: string | undefined) {
		this.props.contentId = value;
	}

	public canHaveChild(): boolean {
		return false;
	}
}

export const isH5pElement = (reference: unknown): reference is H5pElement => reference instanceof H5pElement;
