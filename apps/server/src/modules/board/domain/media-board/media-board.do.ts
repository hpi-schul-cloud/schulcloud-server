import type { BoardExternalReference, BoardLayout, MediaBoardProps } from '../types';
import type { AnyMediaBoardNode, MediaBoardColors } from './types';
import { MediaLine } from './media-line.do';
import { BoardNode } from '../board-node.do';

export class MediaBoard extends BoardNode<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	set layout(layout: BoardLayout) {
		this.props.layout = layout;
	}

	get layout(): BoardLayout {
		return this.props.layout;
	}

	get backgroundColor(): MediaBoardColors {
		return this.props.backgroundColor;
	}

	set backgroundColor(backgroundColor: MediaBoardColors) {
		this.props.backgroundColor = backgroundColor;
	}

	get collapsed(): boolean {
		return this.props.collapsed;
	}

	set collapsed(collapsed: boolean) {
		this.props.collapsed = collapsed;
	}

	canHaveChild(childNode: AnyMediaBoardNode): boolean {
		const allowed: boolean = childNode instanceof MediaLine;

		return allowed;
	}
}

export const isMediaBoard = (reference: unknown): reference is MediaBoard => reference instanceof MediaBoard;
