import { BoardNode } from './board-node.do';
import type { H5PElementProps } from './types';

export class H5PElement extends BoardNode<H5PElementProps> {
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

export const isH5PElement = (reference: unknown): reference is H5PElement => reference instanceof H5PElement;
